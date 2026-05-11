const { spawn, spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const backendDir = path.join(rootDir, 'backend');
const aiDir = path.join(rootDir, 'ai');
const tmpDir = path.join(rootDir, 'tmp');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const FLASK_URL = process.env.AI_API_URL || 'http://localhost:5000';
const PYTHON_EXE =
  process.env.PYTHON_EXE ||
  'C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe';

const started = [];
const suffix = Date.now();
const doctorEmail = `doctor.${suffix}@example.com`;
const patientEmail = `patient.${suffix}@example.com`;
const password = 'Password123';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function isReachable(url) {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

function startProcess(name, command, args, cwd, env = {}) {
  const childEnv = {};
  const seen = new Set();
  for (const [key, value] of Object.entries(process.env)) {
    const normalized = process.platform === 'win32' ? key.toLowerCase() : key;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    childEnv[key] = value;
  }
  Object.assign(childEnv, env);

  const child = spawn(command, args, {
    cwd,
    env: childEnv,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  started.push(child);
  return child;
}

async function waitFor(name, url, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isReachable(url)) return;
    await sleep(2000);
  }
  throw new Error(`${name} did not become reachable at ${url}`);
}

async function request(method, url, options = {}) {
  const response = await fetch(url, {
    method,
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${method} ${url} failed (${response.status}): ${text}`);
  }

  return data;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function createSampleImage() {
  mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `ct-smoke-${suffix}.bmp`);
  const width = 64;
  const height = 64;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelSize = rowSize * height;
  const fileSize = 54 + pixelSize;
  const buffer = Buffer.alloc(fileSize);

  buffer.write('BM', 0);
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(pixelSize, 34);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = 54 + y * rowSize + x * 3;
      const value = Math.round((x / (width - 1)) * 255);
      buffer[offset] = value;
      buffer[offset + 1] = Math.round((y / (height - 1)) * 255);
      buffer[offset + 2] = 180;
    }
  }

  writeFileSync(filePath, buffer);
  return filePath;
}

async function main() {
  const backendAlreadyRunning = await isReachable(`${API_URL}/auth/profile`);
  const flaskAlreadyRunning = await isReachable(`${FLASK_URL}/health`);

  if (!backendAlreadyRunning) {
    console.log('Starting Nest backend...');
    startProcess('backend', 'cmd.exe', ['/c', 'npm.cmd', 'run', 'start'], backendDir);
  }

  if (!flaskAlreadyRunning) {
    console.log('Starting Flask AI service...');
    startProcess('flask', PYTHON_EXE, ['complete_api.py'], aiDir, {
      PYTHONIOENCODING: 'utf-8',
      FLASK_DEBUG: 'false',
    });
  }

  await waitFor('Nest backend', `${API_URL}/auth/profile`);
  await waitFor('Flask AI service', `${FLASK_URL}/health`);

  const doctorAuth = await request('POST', `${API_URL}/auth/register`, {
    body: JSON.stringify({
      full_name: 'Smoke Doctor',
      email: doctorEmail,
      password,
      specialty: 'Radiology',
      hospital: 'Smoke Hospital',
      phone: '+10000000000',
    }),
  });
  const doctorToken = doctorAuth.access_token;
  console.log(`Registered doctor: ${doctorEmail}`);

  const createdPatient = await request('POST', `${API_URL}/patients`, {
    headers: auth(doctorToken),
    body: JSON.stringify({
      full_name: 'Smoke Patient',
      email: patientEmail,
      password,
      date_of_birth: '1990-01-01',
      gender: 'male',
      phone: '+10000000001',
      blood_type: 'O+',
      notes: 'Created by smoke workflow',
    }),
  });
  const patientId = createdPatient.patient._id;
  console.log(`Created patient: ${patientId}`);

  const samplePath = createSampleImage();
  const form = new FormData();
  form.append('patient_id', patientId);
  form.append('type', 'ct');
  form.append('notes', 'Smoke CT upload');
  form.append(
    'file',
    new Blob([Buffer.from(require('node:fs').readFileSync(samplePath))], {
      type: 'image/bmp',
    }),
    path.basename(samplePath),
  );

  const uploadedScan = await request('POST', `${API_URL}/scans`, {
    headers: auth(doctorToken),
    body: form,
  });
  const scanId = uploadedScan.scan._id;
  console.log(`Uploaded scan: ${scanId}`);

  const fileResponse = await fetch(uploadedScan.scan.file_url);
  if (!fileResponse.ok) {
    throw new Error(`Uploaded file URL failed: ${uploadedScan.scan.file_url}`);
  }
  console.log(`Verified uploaded file URL: ${uploadedScan.scan.file_url}`);

  const analysisResult = await request(
    'POST',
    `${API_URL}/analysis/scan/${scanId}/run`,
    { headers: auth(doctorToken) },
  );
  const analysisId = analysisResult.analysis._id;
  console.log(`Ran AI analysis: ${analysisId}`);

  const report = await request('POST', `${API_URL}/reports`, {
    headers: auth(doctorToken),
    body: JSON.stringify({
      patient_id: patientId,
      scan_id: scanId,
      analysis_id: analysisId,
      diagnosis: 'Smoke workflow diagnosis',
      treatment_plan: 'Follow up with specialist.',
      notes: 'Generated by smoke workflow',
      status: 'published',
    }),
  });
  console.log(`Created report: ${report.report._id}`);

  const appointment = await request('POST', `${API_URL}/appointments`, {
    headers: auth(doctorToken),
    body: JSON.stringify({
      patient_id: patientId,
      date_time: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Smoke workflow appointment',
    }),
  });
  console.log(`Created appointment: ${appointment.appointment._id}`);

  const patientAuth = await request('POST', `${API_URL}/auth/login`, {
    body: JSON.stringify({ email: patientEmail, password }),
  });
  const patientToken = patientAuth.access_token;

  const [myScans, myReports, myNotifications, myAppointments] = await Promise.all([
    request('GET', `${API_URL}/scans/my`, { headers: auth(patientToken) }),
    request('GET', `${API_URL}/reports`, { headers: auth(patientToken) }),
    request('GET', `${API_URL}/notifications`, { headers: auth(patientToken) }),
    request('GET', `${API_URL}/appointments/my`, { headers: auth(patientToken) }),
  ]);

  console.log('Patient workflow checks:');
  console.log(`- scans: ${myScans.count}`);
  console.log(`- reports: ${myReports.count}`);
  console.log(`- notifications: ${myNotifications.count}`);
  console.log(`- appointments: ${myAppointments.count}`);
  console.log('Smoke workflow completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    for (const child of started) {
      if (!child.pid) continue;
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    }
  });

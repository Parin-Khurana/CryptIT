import { Application } from 'https://unpkg.com/@splinetool/runtime@1.9.0/build/runtime.js';

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

app.load('assets/spline/globe.splinecode');

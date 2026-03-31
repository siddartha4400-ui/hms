const fs = require('fs');
const path = require('path');

const srcDashboard = String.raw`C:\Users\vydya\.gemini\antigravity\brain\b5d7cff9-4d04-4e8a-8df6-6b5d8cee18e9\dashboard_hd_bg_1774944446666.png`;
const srcHome = String.raw`C:\Users\vydya\.gemini\antigravity\brain\b5d7cff9-4d04-4e8a-8df6-6b5d8cee18e9\home_hd_hero_1774944474812.png`;

const destDashboard = String.raw`f:\docker_projects\hms\frontend\public\dashboard_hd_bg.png`;
const destHome = String.raw`f:\docker_projects\hms\frontend\public\home_hd_hero.png`;

try {
  fs.copyFileSync(srcDashboard, destDashboard);
  console.log('Copied dashboard image successfully.');
  
  fs.copyFileSync(srcHome, destHome);
  console.log('Copied home hero image successfully.');
} catch (e) {
  console.error('Error copying files:', e.message);
}

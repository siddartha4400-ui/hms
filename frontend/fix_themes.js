const fs = require('fs');
const files = [
  'f:/docker_projects/hms/frontend/project_components/bookings/organisam/home-v2.module.css',
  'f:/docker_projects/hms/frontend/project_components/dashboard/organisam/dashboard-v2.module.css'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace rgba(var(--brand-rgb, 6, 182, 212), 0.15) with color-mix(in srgb, var(--brand) 15%, transparent)
  content = content.replace(/rgba\(var\(--([a-zA-Z-]+)-rgb[^)]*\),\s*([0-9.]+)\)/g, (match, varName, opacity) => {
    let percentage = parseFloat(opacity) * 100;
    // ensure no floating point weirdness like 15.000000001
    percentage = Math.round(percentage * 100) / 100;
    return `color-mix(in srgb, var(--${varName}) ${percentage}%, transparent)`;
  });

  // also there might be rgba(var(--brand-rgb, 6,182,212), 0.1) without spaces
  content = content.replace(/rgba\(var\(--([a-zA-Z-]+)-rgb[^)]*\),\s*([0-9.]+)\)/g, (match, varName, opacity) => {
    let percentage = parseFloat(opacity) * 100;
    percentage = Math.round(percentage * 100) / 100;
    return `color-mix(in srgb, var(--${varName}) ${percentage}%, transparent)`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated theme colors in ${file}`);
});

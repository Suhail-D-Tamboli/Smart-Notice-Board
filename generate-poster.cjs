// Simple script to generate placeholder posters
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Function to generate a simple placeholder poster
function generatePlaceholderPoster(filename) {
  const posterPath = path.join(uploadsDir, filename);
  
  // Create a simple SVG placeholder
  const svgContent = `
  <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#22d3ee"/>
    <rect x="20" y="20" width="360" height="260" fill="#0b1224" rx="10"/>
    <text x="200" y="80" font-family="Arial" font-size="24" fill="#22d3ee" text-anchor="middle">
      AI Generated Poster
    </text>
    <text x="200" y="150" font-family="Arial" font-size="18" fill="#e2e8f0" text-anchor="middle">
      This is a placeholder
    </text>
    <text x="200" y="180" font-family="Arial" font-size="18" fill="#e2e8f0" text-anchor="middle">
      for an AI-generated poster
    </text>
  </svg>
  `;
  
  fs.writeFileSync(posterPath, svgContent);
  console.log(`Generated placeholder poster: ${posterPath}`);
}

// Generate a few sample posters
generatePlaceholderPoster('poster-sample1.png');
generatePlaceholderPoster('poster-sample2.png');
generatePlaceholderPoster('poster-sample3.png');

console.log('Placeholder posters generated successfully!');
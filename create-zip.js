
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

// Create a file to stream archive data to
const output = createWriteStream(path.join(process.cwd(), 'claim-management-app.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully!');
  console.log(`Total size: ${archive.pointer()} bytes`);
  console.log('You can download the zip file from the Files panel');
});

// Handle errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add directories to the archive
const dirsToInclude = ['client', 'server', 'shared'];
const filesToInclude = [
  'package.json', 
  'package-lock.json', 
  'tsconfig.json', 
  'tailwind.config.ts', 
  'postcss.config.js',
  'vite.config.ts',
  'drizzle.config.ts'
];

// Add the directories recursively
for (const dir of dirsToInclude) {
  archive.directory(dir, dir);
}

// Add individual files
for (const file of filesToInclude) {
  archive.file(file, { name: file });
}

// Create a README file with instructions
archive.append(`# Claim Management Application

This is a claim management application built with React and Express.

## Installation

1. Install dependencies:

\`\`\`
npm install
\`\`\`

2. Start the development server:

\`\`\`
npm run dev
\`\`\`

3. Build for production:

\`\`\`
npm run build
\`\`\`

4. Start the production server:

\`\`\`
npm start
\`\`\`

`, { name: 'README.md' });

// Finalize the archive
archive.finalize();

#!/usr/bin/env node

/**
 * This script updates Next.js Link components to remove the deprecated legacyBehavior prop
 * and update the structure from <Link><a></a></Link> to simply <Link></Link>.
 * 
 * Run with: node scripts/update-next-links.js
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Directories to exclude
const excludeDirs = ['node_modules', '.next', '.git', 'scripts'];

// Find all JS/JSX/TS/TSX files in the project
async function findFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        const subFiles = await findFiles(fullPath);
        files.push(...subFiles);
      }
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Process a file to update Link components
async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    const originalContent = content;

    // Check if the file uses Link and legacyBehavior
    if (content.includes('legacyBehavior')) {
      // Replace Link components with legacyBehavior prop
      content = content.replace(
        /<Link\s+([^>]*?)href=(['"])([^'"]*)\2([^>]*?)(legacyBehavior)([^>]*?)>\s*<a([^>]*?)>(.*?)<\/a>\s*<\/Link>/gs,
        (match, beforeHref, quoteType, href, afterHrefBeforeLegacy, legacyBehavior, afterLegacy, aProps, children) => {
          // Combine relevant props from <a> and <Link>
          const classMatch = aProps.match(/className=(['"])(.*?)\1/);
          const classNameProp = classMatch ? ` className=${classMatch[1]}${classMatch[2]}${classMatch[1]}` : '';
          
          const styleMatch = aProps.match(/style=(\{.*?\})/s);
          const styleProp = styleMatch ? ` style=${styleMatch[1]}` : '';
          
          // Other props without className and style
          const otherProps = aProps
            .replace(/className=(['"])(.*?)\1/, '')
            .replace(/style=(\{.*?\})/s, '')
            .trim();

          // Combine to form the new Link component
          return `<Link href=${quoteType}${href}${quoteType}${classNameProp}${styleProp}${otherProps ? ' ' + otherProps : ''}>${children}</Link>`;
        }
      );

      // If content changed, write the file
      if (content !== originalContent) {
        await writeFile(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return false;
  }
}

// Main function
async function main() {
  console.log('Updating Next.js Link components to remove legacyBehavior...');
  
  const files = await findFiles(process.cwd());
  let updatedCount = 0;
  
  for (const file of files) {
    const updated = await processFile(file);
    if (updated) {
      updatedCount++;
    }
  }
  
  console.log(`Completed! Updated ${updatedCount} files.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 
#!/usr/bin/env node

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

const program = new Command();

program
  .description("Convert image(s) with optional compression.")
  .option("-i, --input <path>", "Input image file or directory")
  .option("-o, --output <path>", "Output image file or directory")
  .option(
    "-f, --format <format>",
    "Output format (jpeg, png, webp, tiff, etc.)"
  )
  .option("-c, --compression <level>", "Compression level (0-100)", parseInt);

program.parse(process.argv);

const options = program.opts();

if (!options.input || !options.output || !options.format) {
  console.error(
    "Please specify input file/directory, output file/directory, and format."
  );
  process.exit(1);
}

const inputPath = path.resolve(options.input);
const outputPath = path.resolve(options.output);
const format = options.format;
const compression = options.compression;

const isDirectory = fs.lstatSync(inputPath).isDirectory();

const processImage = (inputFile, outputFile) => {
  let image = sharp(inputFile).toFormat(format);

  if (compression !== undefined) {
    if (format === "jpeg") {
      image = image.jpeg({ quality: compression });
    } else if (format === "png") {
      image = image.png({ quality: compression });
    } else if (format === "webp") {
      image = image.webp({ quality: compression });
    } else if (format === "tiff") {
      image = image.tiff({ quality: compression });
    }
  }

  image
    .toFile(outputFile)
    .then(() => {
      console.log(`Converted ${inputFile} to ${outputFile} as ${format}`);
    })
    .catch((err) => {
      console.error(`Error converting image ${inputFile}:`, err);
    });
};

if (isDirectory) {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  fs.readdir(inputPath, (err, files) => {
    if (err) {
      console.error("Error reading input directory:", err);
      process.exit(1);
    }

    files.forEach((file) => {
      const inputFile = path.join(inputPath, file);
      const outputFile = path.join(
        outputPath,
        `${path.parse(file).name}.${format}`
      );

      processImage(inputFile, outputFile);
    });
  });
} else {
  processImage(inputPath, outputPath);
}

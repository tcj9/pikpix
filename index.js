#!/usr/bin/env node

const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const fileType = require("file-type");
const packageJson = require("./package.json");

const program = new Command();

program
  .version(packageJson.version, "-v, --version", "Output the current version")
  .description(
    "Convert and optimize image(s) with optional compression and resizing."
  )
  .option("-i, --input <path>", "Input image file, URL, or directory")
  .option("-o, --output <path>", "Output image file or directory")
  .option(
    "-f, --format <format>",
    "Output format (heic, heif, avif, jpeg, jpg, png, raw, tiff, tif, webp, gif, jp2, jpx, j2k, j2c, svg)"
  )
  .option("-c, --compression <level>", "Compression level (0-100)", parseInt)
  .option(
    "-r, --resize <dimensions>",
    "Resize dimensions in format WIDTHxHEIGHT or WIDTHXHEIGHT"
  )
  .option(
    "--flatten [color]",
    "Flatten the image and fill the background with the specified color"
  )
  .option("--sharpen", "Apply sharpening to the image")
  .option("--denoise", "Apply denoising to the image")
  .option("--grayscale", "Convert the image to grayscale")
  .option(
    "--blur <sigma>",
    "Apply blur with the specified sigma value",
    parseFloat
  )
  .option(
    "--autoOptimize",
    "Automatically apply a set of predefined optimizations"
  );

program.parse(process.argv);

const options = program.opts();

if (!options.input || !options.output || !options.format) {
  console.error(
    "Error: Please specify input file/directory/URL, output file/directory, and format."
  );
  process.exit(1);
}

const inputPath = options.input;
const outputPath = path.resolve(options.output);
let format = options.format.toLowerCase();
const compression = options.compression;
const resize = options.resize ? options.resize.split(/[xX]/).map(Number) : null;

if (format === "jpg") {
  format = "jpeg";
}

const isValidFormat = (format) => {
  const supportedFormats = [
    "heic",
    "heif",
    "avif",
    "jpeg",
    "jpg",
    "png",
    "raw",
    "tiff",
    "tif",
    "webp",
    "gif",
    "jp2",
    "jpx",
    "j2k",
    "j2c",
    "svg",
  ];
  return supportedFormats.includes(format);
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generateUniqueFileName = (dir, baseName, ext) => {
  let fileName = `${baseName}.${ext}`;
  let filePath = path.join(dir, fileName);
  let counter = 1;

  while (fs.existsSync(filePath)) {
    fileName = `${baseName}_${counter}.${ext}`;
    filePath = path.join(dir, fileName);
    counter++;
  }

  return filePath;
};

const applyOptimizations = (image) => {
  image = image.sharpen().median();
  return image;
};

const processImage = async (inputFile, outputFile) => {
  try {
    let imageBuffer;

    if (inputFile.startsWith("http://") || inputFile.startsWith("https://")) {
      const response = await axios.get(inputFile, {
        responseType: "arraybuffer",
      });
      imageBuffer = response.data;

      const type = await fileType.fromBuffer(imageBuffer);
      if (!type || !type.mime.startsWith("image/")) {
        throw new Error("The fetched file is not a valid image.");
      }
    } else {
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Input file ${inputFile} does not exist.`);
      }
      imageBuffer = fs.readFileSync(inputFile);

      const type = await fileType.fromBuffer(imageBuffer);
      if (!type || !type.mime.startsWith("image/")) {
        throw new Error("The input file is not a valid image.");
      }
    }

    let image = sharp(imageBuffer);

    if (resize) {
      if (isNaN(resize[0]) || isNaN(resize[1])) {
        throw new Error(
          "Invalid resize dimensions. Please provide dimensions in the format WIDTHxHEIGHT or WIDTHXHEIGHT."
        );
      }
      image = image.resize({
        width: resize[0],
        height: resize[1],
        fit: sharp.fit.inside,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      });
    }

    if (compression !== undefined) {
      if (compression < 0 || compression > 100) {
        throw new Error(
          "Invalid compression level. Please provide a value between 0 and 100."
        );
      }
      if (["jpeg", "jpg", "avif", "heif", "heic", "webp"].includes(format)) {
        if (format === "jpeg" || format === "jpg") {
          image = image.jpeg({ quality: compression });
        } else if (format === "png") {
          image = image.png({ quality: compression });
        } else if (format === "webp") {
          image = image.webp({ quality: compression });
        } else if (format === "tiff" || format === "tif") {
          image = image.tiff({ quality: compression });
        } else if (format === "heif" || format === "heic") {
          image = image.heif({ quality: compression });
        } else if (format === "avif") {
          image = image.avif({ quality: compression });
        }
      } else {
        console.warn(
          `Warning: Compression setting is not supported for format ${format}.`
        );
      }
    }

    if (options.flatten) {
      image = image.flatten({
        background: options.flatten === true ? "#ffffff" : options.flatten,
      });
    }

    if (options.autoOptimize) {
      image = applyOptimizations(image);
    } else {
      if (options.sharpen) {
        image = image.sharpen();
      }

      if (options.denoise) {
        image = image.median();
      }

      if (options.grayscale) {
        image = image.grayscale();
      }

      if (options.blur) {
        if (isNaN(options.blur) || options.blur <= 0) {
          throw new Error(
            "Invalid blur sigma value. Please provide a positive number."
          );
        }
        image = image.blur(options.blur);
      }
    }

    await image.toFormat(format).toFile(outputFile);
    console.log(`Converted ${inputFile} to ${outputFile} as ${format}`);
  } catch (error) {
    console.error(`Error processing image ${inputFile}:`, error.message);
  }
};

const processDirectory = (inputDir, outputDir) => {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.readdir(inputDir, (err, files) => {
      if (err) {
        console.error("Error reading input directory:", err.message);
        process.exit(1);
      }

      files.forEach((file) => {
        const inputFile = path.join(inputDir, file);
        const outputFile = generateUniqueFileName(
          outputDir,
          path.parse(file).name,
          format
        );

        processImage(inputFile, outputFile);
      });
    });
  } catch (error) {
    console.error(`Error processing directory ${inputDir}:`, error.message);
  }
};

const run = async () => {
  try {
    if (!isValidFormat(format)) {
      console.error(
        "Error: Unsupported format specified. Supported formats are heic, heif, avif, jpeg, jpg, png, raw, tiff, tif, webp, gif, jp2, jpx, j2k, j2c, svg."
      );
      process.exit(1);
    }

    if (fs.existsSync(inputPath)) {
      const isDirectory = fs.lstatSync(inputPath).isDirectory();
      if (isDirectory) {
        processDirectory(inputPath, outputPath);
      } else {
        const outputDir = path.dirname(outputPath);
        ensureDirectoryExists(outputDir);
        const outputFile = generateUniqueFileName(
          outputDir,
          path.parse(outputPath).name,
          format
        );
        await processImage(inputPath, outputFile);
      }
    } else if (
      inputPath.startsWith("http://") ||
      inputPath.startsWith("https://")
    ) {
      const outputDir = path.dirname(outputPath);
      ensureDirectoryExists(outputDir);
      const outputFile = generateUniqueFileName(
        outputDir,
        path.parse(outputPath).name,
        format
      );
      await processImage(inputPath, outputFile);
    } else {
      console.error("Error: Input path does not exist.");
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error in run function: ${error.message}`);
    process.exit(1);
  }
};

run();

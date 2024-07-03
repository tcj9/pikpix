#!/usr/bin/env node

// Import necessary modules
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");
const fileType = require("file-type");
const ProgressBar = require("progress");
const packageJson = require("./package.json");

// Initialize the command-line interface (CLI) with Commander
const program = new Command();

// Define CLI options and their descriptions
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
  )
  .option(
    "--preserve-aspect-ratio",
    "Preserve aspect ratio when resizing the image"
  )
  .option("--lossless", "Apply lossless compression if supported by the format")
  .option("--progressive", "Apply progressive compression for JPEG images")
  .option(
    "--subsample <rate>",
    "Apply chroma subsampling rate (e.g., 4:2:0, 4:4:4)"
  )
  .option(
    "--adaptive-quantization",
    "Apply adaptive quantization for better compression"
  )
  .option(
    "--roi-compression <regions>",
    "Apply region of interest (ROI) compression to specified regions"
  );

// Parse the CLI arguments
program.parse(process.argv);
const options = program.opts();

// Validate required options
if (!options.input || !options.output || !options.format) {
  console.error(
    "Error: Please specify input file/directory/URL, output file/directory, and format."
  );
  process.exit(1);
}

// Extract and set options
const inputPath = options.input;
const outputPath = path.resolve(options.output);
let format = options.format.toLowerCase();
const compression = options.compression;
const subsample = options.subsample;
const resize = options.resize ? options.resize.split(/[xX]/).map(Number) : null;

// Convert 'jpg' to 'jpeg' for format consistency
if (format === "jpg") {
  format = "jpeg";
}

// Validate if the format is supported
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

// Ensure the output directory exists, create if not
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate a unique filename to avoid overwriting existing files
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

// Apply predefined optimizations to the image
const applyOptimizations = (image) => {
  image = image.sharpen().median();
  return image;
};

// Custom quantization table for adaptive quantization
const customQuantizationTable = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16,
  24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109,
  103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

// Process a single image file
const processImage = async (inputFile, outputFile, bar) => {
  try {
    let imageBuffer;

    // Fetch image from URL if input is a URL
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
      // Read image from file if input is a local path
      if (!fs.existsSync(inputFile)) {
        throw new Error(`Input file ${inputFile} does not exist.`);
      }
      imageBuffer = fs.readFileSync(inputFile);

      const type = await fileType.fromBuffer(imageBuffer);
      if (!type || !type.mime.startsWith("image/")) {
        throw new Error("The input file is not a valid image.");
      }
    }

    // Initialize sharp with the image buffer
    let image = sharp(imageBuffer);

    // Apply resize if specified
    if (resize) {
      if (isNaN(resize[0]) || isNaN(resize[1])) {
        throw new Error(
          "Invalid resize dimensions. Please provide dimensions in the format WIDTHxHEIGHT or WIDTHXHEIGHT."
        );
      }
      const resizeOptions = {
        width: resize[0],
        height: resize[1],
        fit: options.preserveAspectRatio ? sharp.fit.inside : sharp.fit.fill,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      };
      image = image.resize(resizeOptions);
    }

    // Validate compression level
    if (compression !== undefined) {
      if (compression < 0 || compression > 100) {
        throw new Error(
          "Invalid compression level. Please provide a value between 0 and 100."
        );
      }
    }

    // Apply lossless compression if specified
    if (options.lossless) {
      if (["png", "webp", "avif", "tiff", "heif", "heic"].includes(format)) {
        if (format === "png") {
          image = image.png({ compressionLevel: compression, effort: 10 });
        } else if (format === "webp") {
          image = image.webp({ quality: compression, lossless: true });
        } else if (format === "avif") {
          image = image.avif({ quality: compression, lossless: true });
        } else if (format === "tiff" || format === "tif") {
          image = image.tiff({ quality: compression, compression: "lzw" });
        } else if (format === "heif" || format === "heic") {
          image = image.heif({ quality: compression, lossless: true });
        }
      } else if (compression !== undefined) {
        console.warn(
          `Warning: Lossless compression is not supported for format ${format}.`
        );
      }
    } else if (compression !== undefined) {
      // Apply specified compression options
      if (["jpeg", "jpg", "avif", "heif", "heic", "webp"].includes(format)) {
        if (format === "jpeg" || format === "jpg") {
          let jpegOptions = {
            quality: compression,
            progressive: options.progressive,
            chromaSubsampling: subsample,
          };
          if (options.adaptiveQuantization) {
            jpegOptions = {
              ...jpegOptions,
              quantizationTable: customQuantizationTable,
            };
          }
          image = image.jpeg(jpegOptions);
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

    // Apply Region of Interest (ROI) compression if specified
    if (options.roiCompression) {
      const regions = options.roiCompression
        .split(",")
        .map((region) => region.split(":").map(Number));
      for (const [x, y, width, height, compression] of regions) {
        const region = image.extract({ left: x, top: y, width, height });
        const compressedRegion = region.jpeg({ quality: compression });
        image = image.composite([
          { input: await compressedRegion.toBuffer(), left: x, top: y },
        ]);
      }
    }

    // Flatten the image if specified
    if (options.flatten) {
      image = image.flatten({
        background: options.flatten === true ? "#ffffff" : options.flatten,
      });
    }

    // Apply auto optimizations if specified
    if (options.autoOptimize) {
      image = applyOptimizations(image);
    } else {
      // Apply individual optimizations if specified
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

    // Save the processed image to the output file
    await image.toFormat(format).toFile(outputFile);
    console.log(`Converted ${inputFile} to ${outputFile} as ${format}`);
    bar.tick(); // Update progress bar
  } catch (error) {
    console.error(`Error processing image ${inputFile}:`, error.message);
  }
};

// Process all images in a directory
const processDirectory = async (inputDir, outputDir) => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read all files in the input directory
    const files = fs.readdirSync(inputDir);
    const bar = new ProgressBar("Processing images [:bar] :percent :etas", {
      total: files.length,
      width: 40,
    });

    // Process each file in the directory
    for (const file of files) {
      const inputFile = path.join(inputDir, file);
      const outputFile = generateUniqueFileName(
        outputDir,
        path.parse(file).name,
        format
      );

      await processImage(inputFile, outputFile, bar);
    }
  } catch (error) {
    console.error(`Error processing directory ${inputDir}:`, error.message);
  }
};

// Main function to run the program
const run = async () => {
  try {
    // Validate format
    if (!isValidFormat(format)) {
      console.error(
        "Error: Unsupported format specified. Supported formats are heic, heif, avif, jpeg, jpg, png, raw, tiff, tif, webp, gif, jp2, jpx, j2k, j2c, svg."
      );
      process.exit(1);
    }

    // Check if input path exists
    if (fs.existsSync(inputPath)) {
      const isDirectory = fs.lstatSync(inputPath).isDirectory();
      if (isDirectory) {
        await processDirectory(inputPath, outputPath);
      } else {
        const outputDir = path.dirname(outputPath);
        ensureDirectoryExists(outputDir);
        const bar = new ProgressBar("Processing image [:bar] :percent :etas", {
          total: 1,
          width: 40,
        });
        const outputFile = generateUniqueFileName(
          outputDir,
          path.parse(outputPath).name,
          format
        );
        await processImage(inputPath, outputFile, bar);
      }
    } else if (
      inputPath.startsWith("http://") ||
      inputPath.startsWith("https://")
    ) {
      const outputDir = path.dirname(outputPath);
      ensureDirectoryExists(outputDir);
      const bar = new ProgressBar("Processing image [:bar] :percent :etas", {
        total: 1,
        width: 40,
      });
      const outputFile = generateUniqueFileName(
        outputDir,
        path.parse(outputPath).name,
        format
      );
      await processImage(inputPath, outputFile, bar);
    } else {
      console.error("Error: Input path does not exist.");
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error in run function: ${error.message}`);
    process.exit(1);
  }
};

// Start the program
run();

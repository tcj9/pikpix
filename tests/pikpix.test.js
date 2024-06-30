const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");
const mockAxios = require("axios-mock-adapter");
const { exec } = require("child_process");
const fileType = require("file-type");

const mock = new mockAxios(axios);

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      }
      resolve({ stdout, stderr });
    });
  });
};

describe("PikPix CLI", () => {
  beforeAll(() => {
    // Set up mock for axios
    mock
      .onGet("https://example.com/image.jpeg")
      .reply(
        200,
        fs.readFileSync(path.join(__dirname, "fixtures", "input.jpeg")),
        { "Content-Type": "image/jpeg" }
      );
  });

  afterAll(() => {
    mock.reset();
  });

  test("should display version", async () => {
    const { stdout } = await runCommand("node ./index.js -v");
    expect(stdout.trim()).toBe(require("../package.json").version);
  });

  test("should convert an image format", async () => {
    const inputPath = path.join(__dirname, "fixtures", "input.jpeg");
    const outputPath = path.join(__dirname, "fixtures", "output.png");
    await runCommand(`node ./index.js -i ${inputPath} -o ${outputPath} -f png`);
    const outputFileExists = fs.existsSync(outputPath);
    expect(outputFileExists).toBe(true);
    const outputFileType = await fileType.fromFile(outputPath);
    expect(outputFileType.ext).toBe("png");
    fs.unlinkSync(outputPath);
  });

  test("should resize an image", async () => {
    const inputPath = path.join(__dirname, "fixtures", "input.jpeg");
    const outputPath = path.join(__dirname, "fixtures", "output_resized.jpeg");
    await runCommand(
      `node ./index.js -i ${inputPath} -o ${outputPath} -f jpeg -r 300x300`
    );
    const outputFileExists = fs.existsSync(outputPath);
    expect(outputFileExists).toBe(true);
    const { width, height } = await sharp(outputPath).metadata();
    expect(width).toBe(300);
    expect(height).toBe(300);
    fs.unlinkSync(outputPath);
  });

  test("should compress an image", async () => {
    const inputPath = path.join(__dirname, "fixtures", "input.jpeg");
    const outputPath = path.join(
      __dirname,
      "fixtures",
      "output_compressed.jpeg"
    );
    await runCommand(
      `node ./index.js -i ${inputPath} -o ${outputPath} -f jpeg -c 50`
    );
    const outputFileExists = fs.existsSync(outputPath);
    expect(outputFileExists).toBe(true);
    const { format, size } = await sharp(outputPath).metadata();
    expect(format).toBe("jpeg");
    fs.unlinkSync(outputPath);
  });

  test("should apply flatten, sharpen, and grayscale optimizations", async () => {
    const inputPath = path.join(__dirname, "fixtures", "input.jpeg");
    const outputPath = path.join(
      __dirname,
      "fixtures",
      "output_optimized.jpeg"
    );
    await runCommand(
      `node ./index.js -i ${inputPath} -o ${outputPath} -f jpeg --flatten --sharpen --grayscale`
    );
    const outputFileExists = fs.existsSync(outputPath);
    expect(outputFileExists).toBe(true);
    const { isProgressive } = await sharp(outputPath).metadata();
    expect(isProgressive).toBe(false);
    fs.unlinkSync(outputPath);
  });

  test("should handle URL input", async () => {
    const inputUrl = "https://picsum.photos/200";
    const outputPath = path.join(__dirname, "fixtures", "output_url.jpeg");
    await runCommand(`node ./index.js -i ${inputUrl} -o ${outputPath} -f jpeg`);
    const outputFileExists = fs.existsSync(outputPath);
    expect(outputFileExists).toBe(true);
    fs.unlinkSync(outputPath);
  });

  test("should process a directory of images", async () => {
    const inputDir = path.join(__dirname, "fixtures", "input_directory");
    const outputDir = path.join(__dirname, "fixtures", "output_directory");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    await runCommand(`node ./index.js -i ${inputDir} -o ${outputDir} -f png`);
    const outputFiles = fs.readdirSync(outputDir);
    expect(outputFiles.length).toBe(2);
    outputFiles.forEach(async (file, index) => {
      const outputFilePath = path.join(outputDir, file);
      const outputFileType = await fileType.fromFile(outputFilePath);
      expect(outputFileType.ext).toBe("png");
      fs.unlinkSync(outputFilePath);
      if (index === 1) {
        fs.rmdirSync(outputDir, { recursive: true, force: true });
      }
    });
  });

  test("should handle non-image files gracefully", async () => {
    const inputPath = path.join(__dirname, "fixtures", "input.txt");
    const outputPath = path.join(__dirname, "fixtures", "output.txt");
    const { stderr } = await runCommand(
      `node ./index.js -i ${inputPath} -o ${outputPath} -f jpeg`
    );
    expect(stderr).toContain("The input file is not a valid image.");
  });

  test("should display an error if the input path does not exist", async () => {
    const inputPath = path.join(__dirname, "fixtures", "nonexistent.jpeg");
    const outputPath = path.join(
      __dirname,
      "fixtures",
      "output_nonexistent.jpeg"
    );

    try {
      await runCommand(
        `node ./index.js -i ${inputPath} -o ${outputPath} -f jpeg`
      );
    } catch (error) {
      console.log("🚀 ~ test ~ stderr:", error.stderr);
      expect(error.stderr).toContain("Input path does not exist");
    }
  });
});

import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary (using the credentials you provided)
cloudinary.config({
  cloud_name: 'dtrin6lwv',
  api_key: '612346921393752',
  api_secret: '9dBp8qxuE8mJC7-3ysDpBDh-_No',
  secure: true
});

async function run() {
  try {
    console.log("Uploading image...");
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      { public_id: 'sample_shoes' }
    );
    
    console.log("--- Upload Successful ---");
    console.log(`Secure URL: ${uploadResult.secure_url}`);
    console.log(`Public ID: ${uploadResult.public_id}`);
    
    // 3. Get image details
    console.log("\n--- Image Details ---");
    console.log(`Width: ${uploadResult.width}px`);
    console.log(`Height: ${uploadResult.height}px`);
    console.log(`Format: ${uploadResult.format}`);
    console.log(`File Size: ${uploadResult.bytes} bytes`);
    
    // 4. Transform the image
    // f_auto: Automatically selects the most efficient image format based on the requesting browser
    // q_auto: Automatically optimizes the image quality to balance file size and visual fidelity
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });
    
    console.log("\n--- Transformation ---");
    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error occurred:", error);
  }
}

run();

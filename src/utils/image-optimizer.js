import heic2any from "https://cdn.jsdelivr.net/npm/heic2any/+esm";

async function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = reject;

    img.src =
      URL.createObjectURL(file);
  });
}

async function convertHeic(file) {
  const converted =
    await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

  return new File(
    [converted],
    file.name.replace(
      /\.(heic|heif)$/i,
      ".jpg"
    ),
    {
      type: "image/jpeg",
    }
  );
}

export async function optimizeProfileImage(
  file,
  artistName = "artist"
) {
  let workingFile = file;

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension === "heic" ||
    extension === "heif"
  ) {
    workingFile =
      await convertHeic(file);
  }

  const image =
    await fileToImage(
      workingFile
    );

  const size = Math.min(
    image.width,
    image.height
  );

  const sx =
    (image.width - size) / 2;

  const sy =
    (image.height - size) / 2;

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 800;
  canvas.height = 800;

  const ctx =
    canvas.getContext("2d");

  ctx.drawImage(
    image,
    sx,
    sy,
    size,
    size,
    0,
    0,
    800,
    800
  );

  const blob =
    await new Promise(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/webp",
          0.8
        );
      }
    );

if (!blob) {
  throw new Error(
    "Failed to generate WEBP image"
  );
}

console.log(
  "Optimized blob:",
  blob
);

console.log(
  "Blob size:",
  blob.size
);

const resultFile = new File(
  [blob],
  "profile.webp",
  {
    type: "image/webp",
  }
);

console.log(
  "Result file:",
  resultFile
);

console.log(
  "Result size:",
  resultFile.size
);

return resultFile;
}
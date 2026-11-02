import { app } from "electron";
import path from "path";
import fs from "fs";
import process from "process";

const exeDir =
  process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath("exe"));
const portablePath = path.join(exeDir, "portable.txt");

if (fs.existsSync(portablePath)) {
  const dataPath = path.join(exeDir, "data");
  app.setPath("userData", dataPath);
}

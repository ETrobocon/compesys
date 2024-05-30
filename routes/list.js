const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { logger } = require("../logger.js");
const loggerChild = logger.child({ domain: "list" });
const fs = require('fs').promises; // fs.promises APIを使用
const path = require('path');

// 再帰的にディレクトリの内容を取得する関数
const getFilesRecursively = async (directory) => {
  let entries = await fs.readdir(directory, { withFileTypes: true });
  let filesDetails = [];

  for (let entry of entries) {
    let fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      filesDetails = filesDetails.concat(await getFilesRecursively(fullPath));
    } else {
      let stats = await fs.stat(fullPath);
      filesDetails.push({
        name: entry.name,
        size: stats.size,
        createdTime: stats.birthtime,
        modifiedTime: stats.mtime,
        path: fullPath
      });
    }
  }

  return filesDetails;
};

router.get("/list", async (req, res) => {
  try {
    const id = req.query.id;
    if (id === undefined || !(id >= 1 && id <= 300)) {
      // IDのフォーマットまたは範囲が無効な場合のエラーレスポンス
      return res.status(400).json({ status: 'Bad Request', message: "Invalid id format or range" });
    }
    const directoryPath = path.join(process.env.TEMP_DIR, id);
    // ディレクトリが存在するか確認
    await fs.access(directoryPath, fs.constants.F_OK);

    // 再帰的にファイル情報を取得
    let fileDetails = await getFilesRecursively(directoryPath);
    if (fileDetails.length === 0) {
      // ファイルが一つもない場合のメッセージ
      return res.status(404).json({ status: 'Not Found', message: "No files in the specified directory" });

    } else {
      // ファイルがある場合は、最終更新日時で降順にソートして送信
      fileDetails.sort((a, b) => b.modifiedTime - a.modifiedTime);
      res.send(fileDetails);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ディレクトリが存在しない場合のエラーレスポンス
      res.status(404).json({ status: 'Not Found', message: 'Directory with specified ID does not exist' });
    } else {
      // その他のエラーの場合
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
});

router.all("*", (req, res, next) => {
  next('router')
});

module.exports = router;

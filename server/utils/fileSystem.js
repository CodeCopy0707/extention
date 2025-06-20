const fs = require("fs")
const path = require("path")

const createDirectories = () => {
  const directories = [path.join(__dirname, "../uploads"), path.join(__dirname, "../notes")]

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  })
}

module.exports = {
  createDirectories,
}

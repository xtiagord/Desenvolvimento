const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

// File to store information about created folders
const foldersInfoFile = path.join(__dirname, 'foldersInfo.json');

// Function to read and update folders info
const updateFoldersInfo = (folderPath) => {
    let foldersInfo = [];

    // Read existing data
    if (fs.existsSync(foldersInfoFile)) {
        const data = fs.readFileSync(foldersInfoFile);
        foldersInfo = JSON.parse(data);
    }

    // Add new folder info
    const newFolderInfo = {
        path: folderPath,
        createdAt: new Date().toISOString(),
    };

    foldersInfo.push(newFolderInfo);

    // Keep only the last 10 entries
    if (foldersInfo.length > 10) {
        foldersInfo = foldersInfo.slice(-10);
    }

    // Write updated data back to file
    fs.writeFileSync(foldersInfoFile, JSON.stringify(foldersInfo, null, 2));
};

app.post('/create-subfolder', upload.single('file'), (req, res) => {
    const { date, mainFolder, baseFolder, subFolderName, directory, newFileName } = req.body;

    if (!date || !mainFolder || !subFolderName || !directory || !newFileName) {
        return res.status(400).send('Date, main folder, subfolder name, directory, and new file name are required.');
    }

    // Formatar a data corretamente para o nome da pasta
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
        return res.status(400).send('Invalid date format. Please use DD/MM/YYYY.');
    }

    const [day, month, year] = dateParts;
    const formattedDate = `${day}-${month}-${year}`;

    // Caminho para a pasta principal de entregas
    const mainFolderPath = path.join(directory, `ENTREGAS ${formattedDate}`);

    // Caminho para a subpasta específica (Argentina ou Paraguai)
    let specificFolderPath;
    if (mainFolder === '- PARAGUAI' || mainFolder === '- ARGENTINA') {
        specificFolderPath = path.join(mainFolderPath, mainFolder);
    } else {
        specificFolderPath = mainFolderPath;
    }

    // Caminho para a subpasta dentro da específica
    const subFolderPath = mainFolder === 'ENTREGAS' ? path.join(specificFolderPath, subFolderName) : path.join(specificFolderPath, baseFolder, subFolderName);

    fs.mkdir(subFolderPath, { recursive: true }, (err) => {
        if (err) {
            return res.status(500).send('Error creating subfolder.');
        }

        // Move the uploaded file to the created subfolder
        if (req.file) {
            const tempPath = req.file.path;
            const fileExt = path.extname(req.file.originalname);
            const targetPath = path.join(subFolderPath, newFileName + fileExt);

            // Copiar o arquivo para o destino
            fs.copyFile(tempPath, targetPath, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error copying the uploaded file.');
                }

                // Remover o arquivo temporário após a cópia bem-sucedida
                fs.unlink(tempPath, (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error deleting the temporary file.');
                    }

                    // Update folders info
                    updateFoldersInfo(subFolderPath);

                    res.send('Subfolder and file created successfully.');
                });
            });
        } else {
            // Update folders info
            updateFoldersInfo(subFolderPath);
            
            res.send('Subfolder created successfully.');
        }
    });
});

// Endpoint to get the last 10 created folders
app.get('/last-10-folders', (req, res) => {
    if (fs.existsSync(foldersInfoFile)) {
        const data = fs.readFileSync(foldersInfoFile);
        const foldersInfo = JSON.parse(data);
        res.json(foldersInfo);
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

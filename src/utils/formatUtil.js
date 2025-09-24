export const formatSize = (value) => {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let size = 1024.0;
    for (let i = 0; i < units.length; i++) {
        if ((value / size) < 1) {
            return `${value.toFixed(2)}${units[i]}`;
        }
        value = value / size;
    }
    return value;
};
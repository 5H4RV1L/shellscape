const COMMANDS = {
    ls: (level) => {
        return Object.keys(level.files).join(" ");
    },

    cat: (level, arg) => {
        if (!arg) return "usage: cat <file>";
        return level.files[arg] || "file not found";
    },

    help: () => {
        return "Available commands: ls, cat, help, clear";
    },

    clear: () => {
        document.getElementById("terminal").innerHTML = "";
        return "";
    }
};

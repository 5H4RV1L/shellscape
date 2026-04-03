function createInputLine() {
    const terminal = document.getElementById("terminal");

    const line = document.createElement("div");
    line.className = "input-line";

    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "user@shellscape:~$";

    const input = document.createElement("input");

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            const value = input.value;

            printOutput(`> ${value}`);
            const result = executeCommand(value);

            if (result) printOutput(result);

            terminal.removeChild(line);
            createInputLine();
        }
    });

    line.appendChild(prompt);
    line.appendChild(input);
    terminal.appendChild(line);

    input.focus();
}

function printOutput(text) {
    const terminal = document.getElementById("terminal");

    const output = document.createElement("div");
    output.textContent = text;

    terminal.appendChild(output);
}

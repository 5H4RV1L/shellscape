function executeCommand(input) {
    const [cmd, ...args] = input.trim().split(" ");
    const arg = args.join(" ");

    if (COMMANDS[cmd]) {
        return COMMANDS[cmd](LEVEL, arg);
    }

    // level-specific commands
    if (LEVEL.expectedCommands[input]) {
        return LEVEL.expectedCommands[input];
    }

    return "command not found";
}

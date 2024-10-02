package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/creack/pty"
	"golang.org/x/term"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run script.go <path_to_cpp_file>")
		os.Exit(1)
	}

	cppFilePath := os.Args[1]
	if !strings.HasSuffix(cppFilePath, ".cpp") {
		log.Fatal("Input file must have a .cpp extension")
	}

	baseName := filepath.Base(cppFilePath)
	execName := strings.TrimSuffix(baseName, filepath.Ext(baseName))

	// Compile the C++ file
	compileCmd := exec.Command("g++", cppFilePath, "-o", execName)
	compileOutput, err := compileCmd.CombinedOutput()
	if err != nil {
		log.Fatalf("Compilation error: %v\n%s", err, compileOutput)
	}

	fmt.Println("Compilation successful.")

	// Run the compiled executable
	cmd := exec.Command("./" + execName)

	// Start the command with a pty
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Fatal(err)
	}

	// Disable input echo by setting the terminal to raw mode
	if termState, err := term.MakeRaw(int(ptmx.Fd())); err != nil {
		log.Fatalf("Error setting raw terminal mode: %v", err)
	} else {
		defer term.Restore(int(ptmx.Fd()), termState)
	}

	// Make sure to close the pty at the end
	defer func() { _ = ptmx.Close() }()

	// Open log file
	logFile, err := os.Create(execName + "_output.log")
	if err != nil {
		log.Fatalf("Error creating log file: %v", err)
	}
	defer logFile.Close()

	// Create a multi-writer to write to both stdout and logfile
	multiWriter := io.MultiWriter(os.Stdout, logFile)

	// Copy the pty output to multiWriter
	go func() {
		_, _ = io.Copy(multiWriter, ptmx)
	}()

	// Copy stdin to the pty input
	go func() {
		_, _ = io.Copy(ptmx, os.Stdin)
	}()

	// Wait for the command to finish
	err = cmd.Wait()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			fmt.Printf("Program exited with code %d\n", exitErr.ExitCode())
		} else {
			fmt.Printf("Error waiting for program: %v\n", err)
		}
	}

	fmt.Printf("Terminal output logged to %s\n", execName+"_output.log")

	// Clean up the executable
	err = os.Remove(execName)
	if err != nil {
		log.Printf("Warning: Failed to remove executable: %v", err)
	}
}

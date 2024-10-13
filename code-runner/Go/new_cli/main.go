package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
    "sync"
    "time"

	"github.com/creack/pty"
	"github.com/fatih/color"
	"github.com/manifoldco/promptui"
	"golang.org/x/term"
)

type Question struct {
	ID            int    `json:"id"`
	InstructorID  int    `json:"instructorId"`
	LabSessionID  int    `json:"labSessionId"`
	Description   string `json:"description"`
	InputsOutputs string `json:"inputsOutputs"`
	TestCaseBased bool   `json:"testCaseBased"`
}

type Status struct {
	StudentID    string            `json:"studentId"`
	LabSessionID string            `json:"labSessionId"`
	Status       map[string]string `json:"status"`
}

type Student struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	Email           string `json:"email"`
	EnrollmentNumber string `json:"enrollmentNumber"`
	DepartmentID    int    `json:"departmentId"`

}

type LabSession struct {
	ID          int         `json:"id"`
	ProgramID   int         `json:"programId"`
	InstructorID int         `json:"instructorId"`
	SessionDate string      `json:"sessionDate"`
	Description string      `json:"description"`
	Program     Program     `json:"program"`
	Instructor  Instructor  `json:"instructor"`
	Questions   []Question   `json:"questions"`
}

type Program struct {
	ID          int         `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	ProgramCode string      `json:"programCode"`
	DepartmentID int         `json:"departmentId"`
	CreatedAt   string      `json:"createdAt"`
}

type Instructor struct {
	ID          int         `json:"id"`
	Name        string      `json:"name"`
	Email       string      `json:"email"`
	DepartmentID int         `json:"departmentId"`
}

var (
	questions []Question
	studentID string
	studentInfo Student
	labSessions []LabSession
	labSessionID string

	// Colors
	bold      = color.New(color.Bold)
	red       = color.New(color.FgRed)
	green     = color.New(color.FgGreen)
	blue      = color.New(color.FgBlue)
	yellow    = color.New(color.FgYellow)
)

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Welcome to the Biskut CLI!")
	for {
		fmt.Print("Enter StudentID : ")
		input, _ := reader.ReadString('\n')
		studentID = strings.TrimSpace(input)

		if verifyStudentID() {
			break
		}
	}

	fetchLabSessions()

	fmt.Println("Type 'help' for a list of commands.")

	for {
		bold.Printf("%s> ", studentInfo.Name)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		if input == "exit" || input == "quit" {
			fmt.Println("Goodbye!")
			return
		}

		handleCommand(input)
	}
}

func handleCommand(input string) {
	parts := strings.Fields(input)
	if len(parts) == 0 {
		return
	}

	command := parts[0]
	args := parts[1:]

	switch command {
	case "help":
		printHelp()
	case "fetch":
		if len(args) > 0 {
			studentID = args[0]
		}
		fetchQuestions()
	case "show":
		displayQuestions()
	case "set":
		handleSetCommand(args)
	case "status":
		fetchStatus()
	case "submit":
		if len(args) != 2 {
			red.Println("Usage: submit <file_path> <question_id>")
			return
		}
		submitSolution(args[0], args[1])
	default:
		red.Println("Unknown command. Type 'help' for a list of commands.")
	}
}

func printHelp() {
	fmt.Println("Available commands:")
	fmt.Println("  help                - Show this help message")
	fmt.Println("  fetch [studentID]   - Fetch questions for the given student ID")
	fmt.Println("  show                - Display fetched questions")
	// fmt.Println("  set studentid <ID>  - Set the student ID")
	fmt.Println("  status              - Fetch and display question status")
	fmt.Println("  submit <file> <qID> - Submit a solution file for a specific question")
	fmt.Println("  exit, quit          - Exit the CLI")
}

func handleSetCommand(args []string) {
	if len(args) != 2 || args[0] != "studentid" {
		red.Println("Invalid 'set' command. Use 'set studentid <ID>'")
		return
	}

	studentID = args[1]
	green.Println("Student ID set to:", studentID)
}

func verifyStudentID() bool {
	if studentID == "" {
		red.Println("Student ID can't be empty. ")
		return false
	}
	url := fmt.Sprintf("http://localhost:3000/api/stu?studentId=%s", studentID)

	resp, err := http.Get(url)
	if err != nil {
		red.Println("Error sending request:", err)
		return false
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusBadRequest {
		red.Println("Bad request. Student ID is not valid.")
		return false
	}

	if resp.StatusCode == http.StatusNotFound {
		red.Println("Student not found.")
		return false
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		red.Println("Error reading response:", err)
		return false
	}

	
	err = json.Unmarshal(body, &studentInfo)
	if err != nil {
		red.Println("Error parsing JSON:", err)
		return false
	}
	green.Println("Welcome, ", studentInfo.Name)
	studentID = fmt.Sprint(studentInfo.ID)
	return true
}

func fetchLabSessions() {
	if studentID == "" {
		red.Println("Student ID is not set. Use 'set studentid <ID>' first.")
		return
	}

	url := fmt.Sprintf("http://localhost:3000/api/stu/labsessions?studentId=%s", studentID)
	resp, err := http.Get(url)
	if err != nil {
		red.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		red.Println("Error reading response:", err)
		return
	}

	err = json.Unmarshal(body, &labSessions)
	if err != nil {
		red.Println("Error parsing JSON:", err)
		return
	}

	green.Println("Lab sessions fetched successfully!")
	displayLabSessions()
}

func displayLabSessions() {
	if len(labSessions) == 0 {
		fmt.Println("No lab sessions available for you. Contact your teacher to get lab sessions.")
		return
	}

	bold.Println("Available lab sessions:")

	templates := &promptui.SelectTemplates{
		Label:    "{{ . }}",
		Active:   "\U0001F336 {{ .Program.Name | cyan }} ({{ .SessionDate | red }})",
		Inactive: "  {{ .Program.Name | cyan }} ({{ .SessionDate | red }})",
		Selected: "\U0001F336 {{ .Program.Name | red | cyan }}",
		Details: `
--------- Lab Session ----------
{{ "Program:" | faint }}	{{ .Program.Name }}
{{ "Date:" | faint }}	{{ .SessionDate }}
{{ "Instructor:" | faint }}	{{ .Instructor.Name }}
{{ "Description:" | faint }}	{{ .Description }}`,
	}

	searcher := func(input string, index int) bool {
		session := labSessions[index]
		name := session.Program.Name
		date := session.SessionDate
		instructor := session.Instructor.Name

		return strings.Contains(strings.ToLower(name), strings.ToLower(input)) ||
			strings.Contains(date, input) ||
			strings.Contains(strings.ToLower(instructor), strings.ToLower(input))
	}

	prompt := promptui.Select{
		Label:     "Select a lab session",
		Items:     labSessions,
		Templates: templates,
		Size:      10,
		Searcher:  searcher,
	}

	index, _, err := prompt.Run()

	if err != nil {
		fmt.Printf("Prompt failed %v\n", err)
		return
	}

	fmt.Printf("You selected lab session: %s (ID: %d)\n", labSessions[index].Program.Name, labSessions[index].ID)

	labSessionID = fmt.Sprint(labSessions[index].ID)
	questions = labSessions[index].Questions
}

func fetchQuestions() {
	if studentID == "" {
		red.Println("Student ID is not set. Use 'set studentid <ID>' first.")
		return
	}

	url := fmt.Sprintf("http://localhost:3000/api/stu/questions?studentId=%s", studentID)
	resp, err := http.Get(url)
	if err != nil {
		red.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		red.Println("Error reading response:", err)
		return
	}

	err = json.Unmarshal(body, &questions)
	if err != nil {
		red.Println("Error parsing JSON:", err)
		return
	}

	green.Println("Questions fetched successfully!")
	displayQuestions()
}

func displayQuestions() {
	if len(questions) == 0 {
		fmt.Println("No questions available. Use 'fetch' to get questions.")
		return
	}

	bold.Println("Available questions:")

	templates := &promptui.SelectTemplates{
		Label:    "{{ . }}",
		Active:   "\U0001F4DD {{ .Description | cyan }} (ID: {{ .ID | red }})",
		Inactive: "  {{ .Description | cyan }} (ID: {{ .ID | red }})",
		Selected: "\U0001F4DD {{ .Description | red | cyan }}",
		Details: `
--------- Question Details ----------
{{ "ID:" | faint }}	{{ .ID }}
{{ "Description:" | faint }}	{{ .Description }}
{{ "Lab Session ID:" | faint }}	{{ .LabSessionID }}
{{ "Test Case Based:" | faint }}	{{ .TestCaseBased }}`,
	}

	searcher := func(input string, index int) bool {
		question := questions[index]
		return strings.Contains(strings.ToLower(question.Description), strings.ToLower(input)) ||
			strings.Contains(strconv.Itoa(question.ID), input)
	}

	prompt := promptui.Select{
		Label:     "Select a question to view details",
		Items:     questions,
		Templates: templates,
		Size:      10,
		Searcher:  searcher,
	}

	index, _, err := prompt.Run()

	if err != nil {
		fmt.Printf("Prompt failed %v\n", err)
		return
	}

	selectedQuestion := questions[index]
	fmt.Printf("You selected question: %s (ID: %d)\n", selectedQuestion.Description, selectedQuestion.ID)
	fmt.Println("Description:", selectedQuestion.Description)
	// Here you can add logic to perform actions on the selected question, like submitting a solution
}


func fetchStatus() {
	if studentID == "" {
		red.Println("Student ID is not set. Use 'set studentid <ID>' first.")
		return
	}

	if len(questions) == 0 {
		red.Println("No questions fetched. Use 'fetch' to get questions first.")
		return
	}

	labSessionID := questions[0].LabSessionID

	url := fmt.Sprintf("http://localhost:3000/api/stu/status?studentId=%s&labSessionId=%d", studentID, labSessionID)
	resp, err := http.Get(url)
	if err != nil {
		red.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		red.Println("Error reading response:", err)
		return
	}

	var status Status
	err = json.Unmarshal(body, &status)
	if err != nil {
		red.Println("Error parsing JSON:", err)
		return
	}

	displayStatus(status)
}

func displayStatus(status Status) {
	bold.Println("Question Status:")
	fmt.Println("--------------------")
	fmt.Printf("Student ID: %s\n", status.StudentID)
	fmt.Printf("Lab Session ID: %s\n", status.LabSessionID)
	fmt.Println("Status:")
	for questionID, questionStatus := range status.Status {
		switch questionStatus {
		case "failed":
			red.Printf("  Question %s: %s\n", questionID, questionStatus)
		case "Not Attempted":
			yellow.Printf("  Question %s: %s\n", questionID, questionStatus)
		default:
			green.Printf("  Question %s: %s\n", questionID, questionStatus)
		}
	}
	fmt.Println("--------------------")
}

func submitSolution(filePath, questionId string) {
	if studentID == "" {
		red.Println("Student ID is not set. Use 'set studentid <ID>' first.")
		return
	}

	question, err := getQuestionById(questionId)
	if err != nil {
		red.Println("Error getting question details:", err)
		return
	}

	url := "http://localhost:3000/api/stu/submit"

	file, err := os.Open(filePath)
	if err != nil {
		red.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("solution", filepath.Base(filePath))
	if err != nil {
		red.Println("Error creating form file:", err)
		return
	}
	_, err = io.Copy(part, file)
	if err != nil {
		red.Println("Error copying file content:", err)
		return
	}

	writer.WriteField("studentId", studentID)
	writer.WriteField("questionId", questionId)

	if !question.TestCaseBased {
		output, err := compileAndRun(filePath)
		if err != nil {
			red.Println("Error compiling and running program:", err)
			return
		}
		writer.WriteField("userOutput", output)
	}

	err = writer.Close()
	if err != nil {
		red.Println("Error closing writer:", err)
		return
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		red.Println("Error creating request:", err)
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		red.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	if question.TestCaseBased {
		fmt.Println("Submission sent. Waiting for response...")
		handleStreamedResponse(resp.Body)
	} else {
		green.Println("\nSubmitted successfully.")
	}
}

func getQuestionById(questionId string) (Question, error) {
	for _, q := range questions {
		if fmt.Sprintf("%d", q.ID) == questionId {
			return q, nil
		}
	}
	return Question{}, fmt.Errorf("question not found")
}

func compileAndRun(filePath string) (string, error) {
    if !strings.HasSuffix(filePath, ".cpp") {
        return "", fmt.Errorf("input file must have a .cpp extension")
    }

    baseName := filepath.Base(filePath)
    execName := strings.TrimSuffix(baseName, filepath.Ext(baseName))

    // Compile the C++ file
    compileCmd := exec.Command("g++", filePath, "-o", execName)
    compileOutput, err := compileCmd.CombinedOutput()
    if err != nil {
        return "", fmt.Errorf("compilation error: %v\n%s", err, compileOutput)
    }

    fmt.Println("Compilation successful.")

    // Run the compiled executable
    cmd := exec.Command("./" + execName)

    // Start the command with a pty
    ptmx, err := pty.Start(cmd)
    if err != nil {
        return "", fmt.Errorf("error starting pty: %v", err)
    }
    defer ptmx.Close()

    // Create a buffer to store the output
    var outputBuffer bytes.Buffer

    // Create a multi-writer to write to both the buffer and stdout
    multiWriter := io.MultiWriter(&outputBuffer, os.Stdout)

    // Use a WaitGroup to manage goroutines
    var wg sync.WaitGroup
    wg.Add(2)

    // Properly manage raw mode
    oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
    if err != nil {
        return "", fmt.Errorf("error setting raw mode: %v", err)
    }
    defer func() {
        if err := term.Restore(int(os.Stdin.Fd()), oldState); err != nil {
            fmt.Printf("Warning: Failed to restore terminal state: %v\n", err)
        }
    }()

    // Copy the pty output to multiWriter
    go func() {
        defer wg.Done()
        io.Copy(multiWriter, ptmx)
    }()

    // Handle input in a separate goroutine
    go func() {
        defer wg.Done()
        io.Copy(ptmx, os.Stdin)
    }()

    // Use a channel to signal when the command is done
    done := make(chan error, 1)
    go func() {
        done <- cmd.Wait()
    }()

    // Wait for the command to finish or timeout
    var runErr error
    select {
    case err := <-done:
        if err != nil {
            if exitErr, ok := err.(*exec.ExitError); ok {
                runErr = fmt.Errorf("program exited with code %d", exitErr.ExitCode())
            } else {
                runErr = fmt.Errorf("error waiting for program: %v", err)
            }
        }
    case <-time.After(30 * time.Second):
        runErr = fmt.Errorf("program execution timed out")
        cmd.Process.Kill()
    }

    // Wait for goroutines to finish
    wg.Wait()

    // Clean up the executable
    if err := os.Remove(execName); err != nil {
        fmt.Printf("Warning: Failed to remove executable: %v\n", err)
    }

    return outputBuffer.String(), runErr
}

func handleStreamedResponse(body io.Reader) {
	reader := bufio.NewReader(body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			red.Println("Error reading response:", err)
			return
		}

		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			if strings.Contains(data, "pushed") {
				fmt.Println("Request sent for execution")
			} else if strings.Contains(data, "start") {
				fmt.Println("Worker has picked up the request")
			} else if strings.Contains(data, "status") {
				fmt.Println("Compilation result:")
				fmt.Println(data)
			} else if strings.Contains(data, "passed") {
				fmt.Println("Execution completed:")
				fmt.Println(data)
			}
		}
	}
}
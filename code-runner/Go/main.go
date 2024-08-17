package main

import (
	"bufio"
	"bytes"
	"fmt"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
)

func main() {
	var questionId string

	submitCmd := &cobra.Command{
		Use:   "submit [file]",
		Short: "Submit a solution file",
		Args:  cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			filePath := args[0]
			submitSolution(filePath, questionId)
		},
	}

	submitCmd.Flags().StringVarP(&questionId, "questionId", "q", "", "Question ID (required)")
	submitCmd.MarkFlagRequired("questionId")

	questionsCmd := &cobra.Command{
		Use:   "questions",
		Short: "Fetch available questions",
		Run: func(cmd *cobra.Command, args []string) {
			fetchQuestions()
		},
	}

	rootCmd := &cobra.Command{Use: "biskut"}
	rootCmd.AddCommand(submitCmd , questionsCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func submitSolution(filePath, questionId string) {
	url := "http://localhost:3000/api/submit"

	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("solution", filepath.Base(filePath))
	if err != nil {
		fmt.Println("Error creating form file:", err)
		return
	}
	_, err = io.Copy(part, file)
	if err != nil {
		fmt.Println("Error copying file content:", err)
		return
	}

	writer.WriteField("studentId", "131")
	writer.WriteField("questionId", questionId)

	err = writer.Close()
	if err != nil {
		fmt.Println("Error closing writer:", err)
		return
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		fmt.Println("Error creating request:", err)
		return
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	fmt.Println("Submission sent. Waiting for response...")

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("Error reading response:", err)
			return
		}

		if strings.HasPrefix(line, "data: ") {
			data := strings.TrimPrefix(line, "data: ")
			handleStreamedResponse(data)
		}
	}
}

func handleStreamedResponse(data string) {
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

func fetchQuestions() {
	url := "http://localhost:3000/api/questions"

	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("Error sending request:", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Error reading response:", err)
		return
	}

	var prettyJSON bytes.Buffer
	err = json.Indent(&prettyJSON, body, "", "  ")
	if err != nil {
		fmt.Println("Error formatting JSON:", err)
		return
	}

	fmt.Println("Available questions:")
	fmt.Println(prettyJSON.String())
}
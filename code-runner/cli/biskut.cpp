#include <iostream>
#include <fstream>
#include <string>
#include <curl/curl.h>
#include "json.hpp"

using json = nlohmann::json;

const std::string API_ENDPOINT = "http://localhost:3000/api/submit";
const std::string STUDENT_ID = "131"; // Placeholder, will be from config later

struct DownloadData {
    std::string content;
    size_t processed_bytes;
};

size_t WriteCallback(void* contents, size_t size, size_t nmemb, DownloadData* data) {
    size_t total_size = size * nmemb;
    data->content.append((char*)contents, total_size);
    
    // Process the chunk
    while (data->processed_bytes < data->content.size()) {
        size_t pos = data->content.find('\n', data->processed_bytes);
        if (pos == std::string::npos) break;
        
        std::string line = data->content.substr(data->processed_bytes, pos - data->processed_bytes);
        data->processed_bytes = pos + 1;
        
        // Try to parse the line as JSON
        try {
            json j = json::parse(line);
            std::cout << "Received: " << j.dump(2) << std::endl;
        } catch (json::parse_error& e) {
            // If it's not valid JSON, just print the line
            std::cout << "Received: " << line << std::endl;
        }
    }
    
    return total_size;
}

bool submitSolution(const std::string& filePath, const std::string& questionId) {
    CURL* curl;
    CURLcode res;
    DownloadData download_data = {"", 0};

    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    
    if (curl) {
        curl_mime* mime = curl_mime_init(curl);
        curl_mimepart* part;

        // Add file
        part = curl_mime_addpart(mime);
        curl_mime_name(part, "solution");
        curl_mime_filedata(part, filePath.c_str());

        // Add studentId
        part = curl_mime_addpart(mime);
        curl_mime_name(part, "studentId");
        curl_mime_data(part, STUDENT_ID.c_str(), CURL_ZERO_TERMINATED);

        // Add questionId
        part = curl_mime_addpart(mime);
        curl_mime_name(part, "questionId");
        curl_mime_data(part, questionId.c_str(), CURL_ZERO_TERMINATED);

        curl_easy_setopt(curl, CURLOPT_URL, API_ENDPOINT.c_str());
        curl_easy_setopt(curl, CURLOPT_MIMEPOST, mime);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &download_data);

        res = curl_easy_perform(curl);

        curl_mime_free(mime);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
            return false;
        }
    }

    curl_global_cleanup();
    return true;
}

int main(int argc, char* argv[]) {
    if (argc != 4 || std::string(argv[2]) != "-q") {
        std::cerr << "Usage: biskut submit <file_path> -q <question_id>" << std::endl;
        return 1;
    }

    std::string filePath = argv[1];
    std::string questionId = argv[3];

    if (submitSolution(filePath, questionId)) {
        std::cout << "Submission process completed" << std::endl;
    } else {
        std::cerr << "Submission failed" << std::endl;
        return 1;
    }

    return 0;
}
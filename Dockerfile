# Use an appropriate base Linux image
FROM alpine:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the "chat-linux" executable into the container
COPY chat-linux /app/

# (Optional) Install any additional dependencies if needed
# RUN apk add --no-cache <package-name>

# Expose any required ports (replace with the actual port number)
EXPOSE 3000

# Specify the command to run when the container starts
CMD ["./chat-linux"]

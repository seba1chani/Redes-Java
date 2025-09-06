import java.net.*;
import java.io.*;

public class ServerTelnet {
    public static void main(String[] args) {
        int port = 8080;

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("🚀 Servidor TCP iniciado en puerto " + port);
            System.out.println("📍 Conecta con: telnet localhost " + port);

            while (true) {
                System.out.println("⏳ Esperando cliente...");
                Socket clientSocket = serverSocket.accept();

                System.out.println("✅ Cliente conectado: " +
                        clientSocket.getInetAddress().getHostAddress());

                // Enviar mensaje de bienvenida inmediatamente
                PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);
                out.println("¡Bienvenido al servidor! Escribe 'quit' para salir.");

                handleClient(clientSocket);
            }
        } catch (IOException e) {
            System.err.println("❌ Error en servidor: " + e.getMessage());
        }
    }

    private static void handleClient(Socket clientSocket) {
        try (
                BufferedReader in = new BufferedReader(
                        new InputStreamReader(clientSocket.getInputStream()));
                PrintWriter out = new PrintWriter(
                        clientSocket.getOutputStream(), true);
        ) {
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                System.out.println("📥 Recibido: " + inputLine);

                if ("quit".equalsIgnoreCase(inputLine)) {
                    out.println("Adiós! Conexión cerrada.");
                    break;
                }

                String response = "Eco: " + inputLine;
                System.out.println("📤 Enviando: " + response);
                out.println(response);
            }
        } catch (IOException e) {
            System.err.println("❌ Error con cliente: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
                System.out.println("🔌 Conexión cerrada\n");
            } catch (IOException e) {
                System.err.println("❌ Error cerrando socket: " + e.getMessage());
            }
        }
    }
}
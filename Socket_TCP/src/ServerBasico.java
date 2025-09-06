import java.net.*;
import java.io.*;

public class ServerBasico {
    public static void main(String[] args) {
        // Puerto donde el servidor escuchará
        int port = 8080;

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Servidor TCP iniciado en puerto " + port);

            // Bucle infinito para aceptar conexiones
            while (true) {
                // Espera una conexión de cliente (BLOQUEANTE)
                Socket clientSocket = serverSocket.accept();
                System.out.println("Cliente conectado: " +
                        clientSocket.getInetAddress());

                // Manejar la conexión del cliente
                handleClient(clientSocket);
            }
        } catch (IOException e) {
            System.err.println("Error en servidor: " + e.getMessage());
        }
    }

    private static void handleClient(Socket clientSocket) {
        try (
                // Crear streams de entrada y salida
                BufferedReader in = new BufferedReader(
                        new InputStreamReader(clientSocket.getInputStream()));
                PrintWriter out = new PrintWriter(
                        clientSocket.getOutputStream(), true);
        ) {
            String inputLine;
            // Leer datos del cliente línea por línea
            while ((inputLine = in.readLine()) != null) {
                System.out.println("Recibido: " + inputLine);

                // Responder al cliente
                out.println("Eco: " + inputLine);
            }
        } catch (IOException e) {
            System.err.println("Error con cliente: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (IOException e) {
                System.err.println("Error cerrando socket: " + e.getMessage());
            }
        }
    }
}


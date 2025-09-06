import java.net.*;
import java.io.*;

public class ClienteBasico {
    public static void main(String[] args) {
        String hostname = "localhost";
        int port = 8080;

        try (
                Socket socket = new Socket(hostname, port);
                PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
                BufferedReader in = new BufferedReader(
                        new InputStreamReader(socket.getInputStream()));
                BufferedReader stdIn = new BufferedReader(
                        new InputStreamReader(System.in))
        ) {
            // ✅ CONEXIÓN ESTABLECIDA
            System.out.println("✅ Conectado al servidor: " +
                    socket.getInetAddress() + ":" + socket.getPort());
            System.out.println("📝 Escribe 'quit' para salir.");

            String userInput;
            while ((userInput = stdIn.readLine()) != null) {
                if ("quit".equalsIgnoreCase(userInput)) break;

                // ✅ ANTES DE ENVIAR
                System.out.println("📤 Enviando: '" + userInput + "'");
                out.println(userInput);

                // ✅ ESPERANDO RESPUESTA
                System.out.println("⏳ Esperando respuesta del servidor...");
                String serverResponse = in.readLine();

                // ✅ RESPUESTA RECIBIDA
                System.out.println("📥 Servidor dice: " + serverResponse);
            }

        } catch (UnknownHostException e) {
            System.err.println("❌ Host desconocido: " + hostname);
        } catch (ConnectException e) {
            System.err.println("❌ No se pudo conectar. ¿El servidor está ejecutándose?");
        } catch (SocketTimeoutException e) {
            System.err.println("❌ Timeout: El servidor no respondió a tiempo");
        } catch (IOException e) {
            System.err.println("❌ Error de E/S: " + e.getMessage());
        } finally {
            System.out.println("👋 Cliente terminado");
        }
    }
}
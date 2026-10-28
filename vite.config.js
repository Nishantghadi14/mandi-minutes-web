import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lightweight dev plugin that prints the 6-digit OTP directly to the developer's terminal
function devOtpLogger() {
  return {
    name: 'dev-otp-logger',
    configureServer(server) {
      server.middlewares.use('/api/dev-otp', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { phone, otp } = JSON.parse(body);
              console.log('\n\x1b[42m\x1b[30m ======================================== \x1b[0m');
              console.log('\x1b[32m⚡ MANDI MINUTES DEV OTP VERIFICATION\x1b[0m');
              console.log(`\x1b[36m📱 Mobile:   \x1b[1m\x1b[37m+91 ${phone}\x1b[0m`);
              console.log(`\x1b[33m🔑 OTP Code: \x1b[1m\x1b[32m${otp}\x1b[0m`);
              console.log('\x1b[42m\x1b[30m ======================================== \x1b[0m\n');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid payload' }));
            }
          });
          return;
        }
        res.statusCode = 404;
        res.end();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devOtpLogger()],
  server: {
    host: true,
  },

  test: {
    testTimeout: 15000,
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('leaflet')) {
              return 'vendor-maps';
            }
            if (id.includes('qrcode')) {
              return 'vendor-qrcode';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-analytics';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

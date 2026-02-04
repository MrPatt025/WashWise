package io.washwise.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Custom application properties configuration.
 * Binds to 'app' prefix in application.yml
 */
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Security security = new Security();
    private AiWorker aiWorker = new AiWorker();
    private RateLimit rateLimit = new RateLimit();

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    public AiWorker getAiWorker() {
        return aiWorker;
    }

    public void setAiWorker(AiWorker aiWorker) {
        this.aiWorker = aiWorker;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }

    public static class Security {
        private Jwt jwt = new Jwt();
        private Cors cors = new Cors();

        public Jwt getJwt() {
            return jwt;
        }

        public void setJwt(Jwt jwt) {
            this.jwt = jwt;
        }

        public Cors getCors() {
            return cors;
        }

        public void setCors(Cors cors) {
            this.cors = cors;
        }

        public static class Jwt {
            private Token accessToken = new Token();
            private Token refreshToken = new Token();

            public Token getAccessToken() {
                return accessToken;
            }

            public void setAccessToken(Token accessToken) {
                this.accessToken = accessToken;
            }

            public Token getRefreshToken() {
                return refreshToken;
            }

            public void setRefreshToken(Token refreshToken) {
                this.refreshToken = refreshToken;
            }

            public static class Token {
                private String secret;
                private long expiration;

                public String getSecret() {
                    return secret;
                }

                public void setSecret(String secret) {
                    this.secret = secret;
                }

                public long getExpiration() {
                    return expiration;
                }

                public void setExpiration(long expiration) {
                    this.expiration = expiration;
                }
            }
        }

        public static class Cors {
            private String allowedOrigins;
            private String allowedMethods;
            private String allowedHeaders;
            private boolean allowCredentials;

            public String getAllowedOrigins() {
                return allowedOrigins;
            }

            public void setAllowedOrigins(String allowedOrigins) {
                this.allowedOrigins = allowedOrigins;
            }

            public String getAllowedMethods() {
                return allowedMethods;
            }

            public void setAllowedMethods(String allowedMethods) {
                this.allowedMethods = allowedMethods;
            }

            public String getAllowedHeaders() {
                return allowedHeaders;
            }

            public void setAllowedHeaders(String allowedHeaders) {
                this.allowedHeaders = allowedHeaders;
            }

            public boolean isAllowCredentials() {
                return allowCredentials;
            }

            public void setAllowCredentials(boolean allowCredentials) {
                this.allowCredentials = allowCredentials;
            }
        }
    }

    public static class AiWorker {
        private String url;
        private int timeout;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public int getTimeout() {
            return timeout;
        }

        public void setTimeout(int timeout) {
            this.timeout = timeout;
        }
    }

    public static class RateLimit {
        private boolean enabled;
        private int requestsPerMinute;
        private int burstCapacity;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }

        public int getBurstCapacity() {
            return burstCapacity;
        }

        public void setBurstCapacity(int burstCapacity) {
            this.burstCapacity = burstCapacity;
        }
    }
}

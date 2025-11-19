from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import time
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path}")
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"Response: {request.method} {request.url.path} "
                f"Status: {response.status_code} "
                f"Duration: {process_time:.3f}s"
            )
            
            # Add custom header with process time
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Error: {request.method} {request.url.path} "
                f"Error: {str(e)} "
                f"Duration: {process_time:.3f}s"
            )
            raise

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Middleware for API key authentication"""
    
    def __init__(self, app, public_paths: list = None):
        super().__init__(app)
        self.public_paths = public_paths or ["/health", "/metrics", "/docs", "/redoc", "/openapi.json"]
        self.api_key = os.getenv("API_KEY", None)
        self.enabled = self.api_key is not None
        
        if not self.enabled:
            logger.warning("API_KEY not set. Authentication middleware disabled.")
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public paths
        if request.url.path in self.public_paths or not self.enabled:
            return await call_next(request)
        
        # Check for API key in header
        api_key = request.headers.get("X-API-Key")
        
        if not api_key or api_key != self.api_key:
            logger.warning(f"Unauthorized access attempt from {request.client.host}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or missing API key"}
            )
        
        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

def setup_middlewares(app, enable_auth: bool = False):
    """Setup all middlewares"""
    
    # Add rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # Add request logging
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add security headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Add authentication if enabled
    if enable_auth:
        app.add_middleware(AuthenticationMiddleware)
        logger.info("Authentication middleware enabled")
    
    logger.info("All middlewares configured")

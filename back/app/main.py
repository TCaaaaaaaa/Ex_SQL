from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import levels, sql

app = FastAPI(title="ExtenicSQL API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(levels.router, prefix="/api/levels", tags=["levels"])
app.include_router(sql.router, prefix="/api/sql", tags=["sql"])

@app.get("/")
async def root():
    return {"message": "Welcome to ExtenicSQL API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

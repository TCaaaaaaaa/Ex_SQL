from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import levels, sql, users
from app.core.database import engine, Base

app = FastAPI(title="ExtenicSQL API")

# Initialize DB tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
async def root():
    return {"message": "Welcome to ExtenicSQL API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

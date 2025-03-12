FROM python:3.11 

WORKDIR /app

# Install all the requirements listed in requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt 
COPY . .


EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

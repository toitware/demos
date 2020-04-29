from python:3.7-buster

WORKDIR /app

COPY requirements.txt /app/

RUN update-ca-certificates
RUN pip install -r requirements.txt
ENV CONFIG_FILE /app/config.yaml
ENV CERT_FILE /app/GlobalSign_Root_CA_R2.cert

copy *.py *.cert main.sh /app/
copy web /app/web
copy toit /app/toit

COPY config.yaml config.yaml
RUN pwd
RUN ls

ENTRYPOINT ["./main.sh"]

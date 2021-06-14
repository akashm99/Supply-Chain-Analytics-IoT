# IoT and Analytics for Supply Chain
IoT is the key technology used in Industry 4.0. One of the areas that has benefitted the most
with the development of IoT is Supply Chain Management (SCM) through new technologies
such as sensors, data storage, decision making tools etc. In this paper we successfully
implemented a small supply chain scenario where we built a transparent and efficient network
of various participants in supply chain and automated flow for a predefined supply chain
scenario. On the conceptual understandings of MQTT, IoT and Cloud we created algorithms
and helper functions for our project using various APIs which included location publish and
subscribe to and from cloud, location tracking, converting geocoordinates to street addresses
and many more, also built a custom simulator to generate location data, have a better control
over our data generated, and visualize data in location in best possible manner. Lack of sharing
of any information at every level in supply chain can hinder the growth of supply chain as so
this paper demonstrates that how IOT can enhance Supply Chain Management with a use case
built with utilizing various APIs, tools and services.



## How to Run

#### 1. Create API-Keys for HERE, AWS Access keys(* permissions for AWS IoT Core), Iot Core Endpoints.
#### 2. In 'js' folder create file 'apikey.js'.
#### 3. Paste below code in 'apikey.js' with modifications and save:
export const region = "YOUR AWS REGION";<br>
export const endpoint = "IOT ENDPOINT";<br>
export const aws_key = "AWS ACCESS KEY";<br>
export const aws_secret = "AWS SECRET KEY";<br>
export const here_api = "HERE API KEY";<br>
#### 4. load 'index.html' on server(localhost).

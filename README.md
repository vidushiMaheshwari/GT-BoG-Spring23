## **Introduction**
Hello, thank you for considering my application for Bits of Good. I have completed the project to the best of my abilities till level 5, and this documentation is to explain and clarify differnt parts of the assessment. I have used **Express, Google Firestore and Storage** for the project. 
## Setup
1. Clone the project and run npm install in the terminal. Fill in a string and a number in process.env file for JWT_STRING and SALT_ROUNDS respectively.
2. Install packages through npm install.
3. Start the server through npm start.
4. Different api end points can be tested through importing postman_example_test.json in the postman app. [Link to tests section!](#tests)

## **About Database**
### Rules
To prevent user from writing invalid data (missing but required keys), I have implemented firebase rules instead of writing javascript code.
### Structure
"Training" collection is a subcollection inside "Animal" collection. "Animal" collection is furthermore a subcollection inside "User". I wanted to implement so because user has to provide Animal and Training ids, and conflicting ids with some other user's animal or training log might have been inconvinient.

## **About Storage**
All images are stored through a combination of user's unique ids in a public bucket. I had to make the bucket public to store valid links in database and allow tests without worrying about adding authentication. 

To save to the storage, your local environment needs to have user credentials of a Google account (Look at [third](#tests) point of Tests). This is an alternative of implementing Auth. This reduces the security of bucket but I chose this option in order to prevent adding service account credentials on GitHub (required for both Auth and Storage).

## **Endpoints**
### **/api/user**
Doesn't require authentication. Basic Firebase Rules. Asks for another id if another user document with given id exist.
### **/api/animal**, **/api/training**
Requires authentication. Implements Firebase Rules. Checks if no other animal/ training log with the same id inside the appropriate sub collection.

### **/api/admin/users**, **/api/admin/animals**, **/api/admin/training**
Doesn't require authentication. Provides some number of queries (with default value 1, but can be changed by passing in `lim` value in request body) in descending order of 'last name', 'hoursTrained' and 'hours' respectively. To recieve next set of queries, resend the request in the same session. Once all entries are traversed, it circles back to the first one.

### **/api/user/login**, **/api/user/verify**
Queries and collects all documents where email is same as provided by the user. (Yes, there can be more than one document with same email 😞 which could've been prevented by querying the document before creating the user in `/api/user`). Checks if any user and password combination is valid (through bcrypt) redirecting to verify which creates a JWT token and returns a JSON with jwt token.

### **/api/file/upload**
Uses multipart/form-data, with image/ video with the key being 'file'. Authentication is required. If no other information is given, it will store the value in public bucket of Google Storage and save the url to the current user's `profilePicture` field. If only animal_id is given, it does the same for the animal of that user, saving the url to `profilePicture` of animal field. If both animal_id and training_id are given, it updates trainingVideo field of the training log of given animal. For both animal's profile picture and training video, the collection should already exists (for example creating a profile picture of an animal without its name, and hoursTrained is not possible)

## Tests
Almost all the test cases are designed to work, however you can edit them to fail. There are some examples associated with each case, whose body you can copy and paste. 

Some possible reasons for unexpexted error can include requirement of authentication and insufficient data in uploading images.

1. For authentication, please login with valid id and password and add the token to the request header. A login is valid for an hour.
2. For insufficient data, please re upload the file to postman as the json file doesn't include the correct path to it.
3. If you get a prompt saying could not load default credentials, please run the command `gcloud auth application-default login` in [Google Cloud SDK](https://cloud.google.com/sdk/docs/install). If it still fails, add the local location of the file with credentials in process.env associated to the variable `GOOGLE_APPLICATION_CREDENTIALS`.

Thank you for reading all the way through this 😊. Hope you have a smooth experience testing this code. 

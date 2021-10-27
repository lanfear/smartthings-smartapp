# (Re)Verify The App Registration

## Copy the value output in `yarn tunnel` task output for the 'https' url

![NGrok Out](ngrok.png)

## Paste to your application configuration

### Edit The Existing App      
![Edit Existing App](runsetup1.png)

### Edit the Target URL

- **ONLY MODIFY** ngrok hostname, do not remove the `/smartapp/rule` path

![Edit Target URL](runsetup2.png)

### Next, Next, Save (Making no other changes)

## Verify your App Registration 

### Step 1
![Verify App Registration](runsetup3.png)

### Step 2

 ![Verification Window](runsetup4.png)

## **Go to the output of the `yarn start` task** and follow this link

 ![Verification Link](runsetup5.png)

 ## Once successful, after a refresh, the 'Verify App Registration' link and message (from screenshot in step #1) will go away from the app management screen
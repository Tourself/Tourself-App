# TOURSELF Project: Deployment to cPanel

This guide provides step-by-step instructions on how to deploy this React/Vite-based application from a GitHub repository to a cPanel hosting environment.

---

## Method 1: Manual Deployment via cPanel (Recommended for first-time setup)

This method ensures the environment is set up correctly. Follow these steps carefully for the initial deployment.

### Step 1: Clone the Repository in cPanel

1.  Log in to your cPanel account.
2.  In the "Files" section, open **Git™ Version Control**.
3.  Click **Create**.
4.  Paste your GitHub repository's **Clone URL**.
5.  cPanel will suggest a **Repository Path** (e.g., `/home/your_user/tourself`). Keep this path, as you'll need it.
6.  Click **Create** to clone the repository.

### Step 2: Set Up the Node.js Application

This step makes `npm` and `node` available in your environment.

1.  Go back to the cPanel main dashboard.
2.  In the "Software" section, open **Setup Node.js App**.
3.  Click **Create Application**.
4.  **Node.js version:** Select the latest available LTS version (e.g., 20.x.x or higher).
5.  **Application mode:** Set to **Development**.
6.  **Application root:** Enter the exact path where you cloned your repository (e.g., `/home/your_user/tourself`).
7.  **Application URL:** Select the domain or subdomain where you want the app to be live.
8.  **Application startup file:** You can leave this blank.
9.  Click **Create**.

### Step 3: Install Dependencies and Build the Project

This is the most critical step. Do not run `npm install` from the terminal first.

1.  After the application is created, stay on the **Setup Node.js App** page.
2.  You should see a button that says **Run NPM Install**. Click it and wait for the process to complete successfully. This allows cPanel to correctly set up the `node_modules` directory.
3.  Once the NPM install is complete, go back to the cPanel dashboard and open the **Terminal** in the "Advanced" section.
4.  Find the command at the top of the **Setup Node.js App** page to enter the virtual environment. It will look like this: `source /home/your_user/nodevenv/tourself/20/bin/activate`. Copy this command.
5.  **Paste and run the command** in the terminal. Your terminal prompt should change.
6.  Navigate to your project's directory: `cd /home/your_user/tourself` (use your specific path).
7.  Run the build command to generate the static production files:
    ```bash
    npm run build
    ```
    This creates a `dist` folder inside your project directory containing your live website files.

### Step 4: Configure Apache to Serve the App

The final step is to tell the webserver how to find and serve your built application.

1.  In the cPanel **File Manager**, navigate to your project's root folder (`/home/your_user/tourself`).
2.  Create a new file named `.htaccess` (if it doesn't already exist).
3.  Edit the `.htaccess` file and add the following code. This configuration tells the server to route all traffic to your app's `dist` folder and handles the client-side routing for React Router.

    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      
      # Rewrite asset requests (JS, CSS, images) to the dist folder
      RewriteRule ^(assets/.*)$ /dist/$1 [L]
      
      # For all other requests that are not existing files or directories,
      # serve the main index.html from the dist folder. This makes React Router work.
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule ^(.*)$ /dist/index.html [L]
    </IfModule>
    ```
4.  **Save the file.** Go to your Application URL, and your site should now be live!

---
## Troubleshooting

### Error: `WebAssembly.instantiate(): Out of memory`

This error occurs during the `npm run build` step because the build process requires more memory than your cPanel Node.js application is allowed by default.

**Solution: Increase the Memory Limit**

1.  In cPanel, go to **Setup Node.js App**.
2.  Find your application in the list and click the **Edit (pencil) icon**.
3.  Scroll down to the field labeled **NODE_OPTIONS**.
4.  In the box, enter the following to increase the memory limit to 2GB:
    ```
    --max-old-space-size=2048
    ```
5.  Click **Save**, and then click the **Restart** button at the top of the page.
6.  Go back to the **Terminal**, enter the virtual environment again, `cd` to your project directory, and re-run `npm run build`. The build should now complete successfully.

**Alternative Solution: Build Locally**

If you cannot increase the memory limit, you can build the project on your own computer and upload only the final files.
1. On your local machine, run `npm install` and then `npm run build`.
2. This will create a `dist` folder.
3. In cPanel's **File Manager**, navigate to your project's folder (`/home/your_user/tourself`).
4. **Delete** any existing `dist` folder on the server.
5. Click **Upload**, select the `dist` folder from your local machine, and upload it as a `.zip` file.
6. Once uploaded, right-click the `dist.zip` file and select **Extract**.

### Error: `Cloudlinux NodeJS Selector demands to store node modules...`

This happens if you run `npm install` in the terminal before using the cPanel button.
**Solution:** Use the cPanel **File Manager**, navigate to your project folder (`/home/your_user/tourself`), **delete** the `node_modules` folder, and then go back and click the **Run NPM Install** button on the "Setup Node.js App" page.

---

## Method 2: Automated Deployment with `.cpanel.yml` (For future updates)

Once you have completed the manual deployment successfully, you can automate future updates.

### Step 1: Create the `.cpanel.yml` file

In the root of your project on your local computer, create a file named `.cpanel.yml` with this content:

```yaml
---
deployment:
  tasks:
    - /bin/npm install
    - /bin/npm run build
```
Commit and push this file to your GitHub repository.

### Step 2: Deploy Updates

Now, whenever you push changes to your GitHub repository:
1.  Go to **Git™ Version Control** in cPanel.
2.  Click **Manage** on your repository.
3.  Go to the **Pull or Deploy** tab.
4.  Click **Deploy HEAD Commit**.

cPanel will automatically pull the latest changes and run the `npm install` and `npm run build` commands for you, updating your live site.

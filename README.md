# TOURSELF Project: Deployment to cPanel (Revised & Reliable Guide)

This guide provides the definitive step-by-step instructions for deploying this React/Vite application to a standard cPanel hosting environment. This method separates the **build process** from the **serving process**, which is the most reliable way to host a static single-page application (SPA) on cPanel.

---

## Deployment Workflow Overview

1.  **Clone Repo:** Use cPanel's Git tool to pull your project from GitHub.
2.  **Setup Node.js:** Create a Node.js "application" to get access to `npm` and `node` for building.
3.  **Build Project:** Use the cPanel terminal to install dependencies and run the build command (`npm run build`). This creates the final, optimized website files in a `dist` folder.
4.  **Copy Files:** Copy the contents of the `dist` folder to your public web directory (`public_html`).
5.  **Configure Server:** Create a `.htaccess` file in `public_html` to handle React's client-side routing.
6.  **Stop Node.js App:** Since the web server (Apache) is now serving the files, the Node.js process is no longer needed and can be stopped.

---

## Step-by-Step Instructions

### Step 1: Clone the Repository in cPanel

1.  Log in to your cPanel account.
2.  In the "Files" section, open **Git™ Version Control**.
3.  Click **Create**.
4.  Paste your GitHub repository's **Clone URL**.
5.  cPanel will suggest a **Repository Path** (e.g., `/home/your_user/tourself`). Keep this path.
6.  Click **Create**.

### Step 2: Set Up the Node.js Environment

This step is only to make `npm` and `node` available for the build process.

1.  Go back to the cPanel main dashboard.
2.  In the "Software" section, open **Setup Node.js App**.
3.  Click **Create Application**.
4.  **Node.js version:** Select the latest available LTS version (e.g., 20.x.x or higher).
5.  **Application mode:** Set to **Development**.
6.  **Application root:** Enter the exact path where you cloned your repository (e.g., `/home/your_user/tourself`).
7.  **Application URL:** Select the domain/subdomain. **This will initially show a default page, which we will fix.**
8.  **Application startup file:** You can leave this blank.
9.  Click **Create**.

### Step 3: Install Dependencies and Build the Project

1.  On the **Setup Node.js App** page, find your new application.
2.  Click the **Run NPM Install** button and wait for it to complete.
3.  Go to the cPanel dashboard and open the **Terminal** in the "Advanced" section.
4.  At the top of the **Setup Node.js App** page, find the command to enter the virtual environment. It looks like `source /home/your_user/nodevenv/tourself/20/bin/activate`. Copy this command.
5.  **Paste and run this command** in the terminal.
6.  Navigate to your project's directory: `cd /home/your_user/tourself`
7.  Run the build command:
    ```bash
    npm run build
    ```
    This creates a `dist` folder inside `/home/your_user/tourself`.

### Step 4: Copy Built Files to the Public Directory (CRITICAL STEP)

This moves your website files to where the world can see them.

1.  In cPanel, open the **File Manager**.
2.  Navigate to your project's `dist` folder (e.g., `/home/your_user/tourself/dist`).
3.  Click **Select All**, then right-click and choose **Copy**.
4.  For the file path to copy to, enter the path to your public web directory. This is usually `/home/your_user/public_html`. If you're using a subdomain, it might be something like `/home/your_user/public_html/subdomain`.
5.  Click **Copy File(s)**.

### Step 5: Configure the Web Server with `.htaccess`

This step ensures that React Router works correctly when a user reloads a page.

1.  In the **File Manager**, navigate to the `public_html` directory where you just copied the files.
2.  Create a new file named `.htaccess` (or edit the existing one).
3.  Add the following code. This tells the server to send all page requests to your `index.html` file, allowing React to handle the routing.

    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```
4.  **Save the file.**

### Step 6: Stop the Node.js Application (CRITICAL STEP)

Your site is now being served by the main web server (Apache). The Node.js process is no longer needed and will interfere if it's left running.

1.  Go back to **Setup Node.js App** in cPanel.
2.  Find your application in the list.
3.  Click the **Stop App** button.

**Your website should now be live and working correctly at your URL!**

---

## Updating Your Website Later

When you push new code to GitHub, repeat these steps:
1.  In cPanel **Git Version Control**, pull the latest changes.
2.  Repeat **Step 3** (enter terminal, run `npm run build`).
3.  Repeat **Step 4** (copy files from `dist` to `public_html`). You will be asked to overwrite the old files.

---

## Troubleshooting

### Seeing the default 'It Works!' Node.js page?
This means the Node.js application is still running and intercepting the requests. You **must** complete **Step 6** and click **Stop App**. Also ensure you have correctly copied the files in **Step 4**.

### Error: `WebAssembly.instantiate(): Out of memory`
This happens during `npm run build`. Your Node.js app needs more memory.
1.  In cPanel, go to **Setup Node.js App**.
2.  Click the **Edit (pencil) icon** for your application.
3.  Find the field labeled **NODE_OPTIONS**.
4.  Enter `--max-old-space-size=2048` to increase the memory limit to 2GB.
5.  Click **Save**, then **Restart**.
6.  Retry the `npm run build` command in the terminal.

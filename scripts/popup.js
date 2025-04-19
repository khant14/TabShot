document.addEventListener('DOMContentLoaded', function() {
  const captureBtn = document.getElementById('captureBtn');
  const tabsList = document.getElementById('tabsList');
  const fullPageToggle = document.getElementById('fullPageToggle');

  // Load saved tabs when popup opens
  loadSavedTabs();

  captureBtn.addEventListener('click', async () => {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      let screenshot;
      if (fullPageToggle.checked) {
        // Capture full page
        screenshot = await captureFullPage(tab.id);
      } else {
        // Capture visible area
        screenshot = await chrome.tabs.captureVisibleTab(null, {
          format: 'jpeg',
          quality: 80
        });
      }
      
      // Get existing tabs or initialize empty array
      const result = await chrome.storage.local.get('tabs');
      const savedTabs = result.tabs || [];
      
      // Add new tab with screenshot
      savedTabs.push({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        timestamp: new Date().toISOString(),
        screenshot: screenshot,
        isFullPage: fullPageToggle.checked
      });
      
      // Save updated tabs
      await chrome.storage.local.set({ tabs: savedTabs });
      
      // Refresh the tabs list
      loadSavedTabs();
    } catch (error) {
      console.error('Error capturing tab:', error);
    }
  });

  async function captureFullPage(tabId) {
    try {
      // Get the page dimensions
      const [{ result: dimensions }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          return {
            width: Math.max(
              document.documentElement.scrollWidth,
              document.body.scrollWidth,
              document.documentElement.clientWidth
            ),
            height: Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight,
              document.documentElement.clientHeight
            ),
            devicePixelRatio: window.devicePixelRatio || 1
          };
        }
      });

      // Create a canvas with the full page dimensions
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width * dimensions.devicePixelRatio;
      canvas.height = dimensions.height * dimensions.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(dimensions.devicePixelRatio, dimensions.devicePixelRatio);

      // Get the viewport height
      const [{ result: viewportHeight }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => window.innerHeight
      });

      // Calculate number of chunks needed
      const chunks = Math.ceil(dimensions.height / viewportHeight);
      
      // Store original scroll position
      const [{ result: originalScroll }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => window.scrollY
      });

      // Capture each chunk
      for (let i = 0; i < chunks; i++) {
        // Scroll to position
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (scrollY) => window.scrollTo(0, scrollY),
          args: [i * viewportHeight]
        });

        // Wait for scroll and any dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 150));

        // Capture visible area
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: 'jpeg',
          quality: 80
        });

        // Draw the captured area onto canvas
        const img = new Image();
        await new Promise(resolve => {
          img.onload = resolve;
          img.src = dataUrl;
        });

        ctx.drawImage(img, 0, i * viewportHeight);
      }

      // Restore original scroll position
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (scrollY) => window.scrollTo(0, scrollY),
        args: [originalScroll]
      });

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Error in captureFullPage:', error);
      throw error;
    }
  }

  async function loadSavedTabs() {
    try {
      const result = await chrome.storage.local.get('tabs');
      const tabs = result.tabs || [];
      
      // Clear existing list
      tabsList.innerHTML = '';
      
      // Sort tabs by timestamp in descending order (newest first)
      const sortedTabs = [...tabs].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Add each saved tab to the list
      sortedTabs.forEach((tab, index) => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';
        
        // Create the tab content
        let tabContent = `
          <div class="tab-header">
            <div class="tab-info">
              <div class="tab-title">${tab.title}</div>
              <div class="tab-url">${tab.url}</div>
              <div class="tab-time">${new Date(tab.timestamp).toLocaleString()}</div>
              ${tab.isFullPage ? '<div class="tab-badge">Full Page</div>' : ''}
            </div>
            <div class="tab-actions">
              <button class="save-btn" data-index="${tabs.indexOf(tab)}">Save</button>
              <button class="delete-btn" data-index="${tabs.indexOf(tab)}">Delete</button>
            </div>
          </div>
        `;
        
        // Add screenshot if available
        if (tab.screenshot) {
          tabContent += `<img class="tab-screenshot" src="${tab.screenshot}" alt="Tab screenshot">`;
        }
        
        tabElement.innerHTML = tabContent;
        tabsList.appendChild(tabElement);
      });

      // Add click handlers for delete buttons
      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const index = parseInt(e.target.dataset.index);
          await deleteTab(index);
        });
      });

      // Add click handlers for save buttons
      document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          const index = parseInt(e.target.dataset.index);
          await saveScreenshot(index);
        });
      });
    } catch (error) {
      console.error('Error loading saved tabs:', error);
    }
  }

  async function deleteTab(index) {
    try {
      const result = await chrome.storage.local.get('tabs');
      const tabs = result.tabs || [];
      
      // Remove the tab at the specified index
      tabs.splice(index, 1);
      
      // Save the updated tabs
      await chrome.storage.local.set({ tabs: tabs });
      
      // Refresh the tabs list
      loadSavedTabs();
    } catch (error) {
      console.error('Error deleting tab:', error);
    }
  }

  async function saveScreenshot(index) {
    try {
      const result = await chrome.storage.local.get('tabs');
      const tabs = result.tabs || [];
      const tab = tabs[index];

      if (!tab || !tab.screenshot) {
        console.error('No screenshot found for this tab');
        return;
      }

      // Create a download link
      const link = document.createElement('a');
      link.href = tab.screenshot;
      
      // Generate filename from tab title and timestamp
      const timestamp = new Date(tab.timestamp).toISOString().replace(/[:.]/g, '-');
      const sanitizedTitle = tab.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedTitle}_${timestamp}.jpg`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error saving screenshot:', error);
    }
  }
}); 
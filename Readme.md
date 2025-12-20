**Beyond Me Btw** is a personal blog and portfolio platform designed to showcase projects and articles that go beyond the ordinary. This site was designed and coded from scratch by me, hosted on a server that uses Nginx and Ubunutu. With innovation at the core, this site to offer a seamless integration of new features as my knowledge  base expands, making it a endlessly growing repository of creativity and technical insights.

Check out the site [BeyondMeBtw.com](https://beyondmebtw.com)

Also check out other showcases

- **Blog:** [Blog.BeyondMeBtw.com](https://blog.beyondmebtw.com)
- **Minis:** [Minis.BeyondMeBtw.com](https://minis.beyondmebtw.com)


<img src="https://beyondmebtw.com/assets/images/homer.png" alt="Home page">
The Current Home Page


## Changelog:

### 3.5 (20/12/25)
- made some backend changes to the manage site, featured posts was still using the old authentication format, updated that.
- logout button was not working and not styled properly, that has been fixed

### 3.4 (2/10/25)
- Made some styling change to the haptic trailer project
- removed the storage method for the video being used in the haptic trailer project
- replaced the video for the haptic trailer project with a youtube video as the older video was being pinged too much causing too much data usage

### 3.3  (12/09/2025)
- Made some styling changes to MINIS page
- expanded the post part and adjusted fonts
- made the title at the top more attractive by changing the font and color of certain parts

### 3.2 (05/09/2025)
- Made the title BEYOND ME BTW in the pages a clickable thing
- removed useless animations from the minis part
- changed the minis id generation to only do dates and not time as updation was messy
- removed home button from minis because it served no purpose

### 3.1 (01/09/2025)
- reduced lag on the minis page by reworking how content is loaded, removed the marked down parsing which is heavy to just a json data entry, the text is converted into html and stored into json
- along with that a method to create a html file with that content is also created and added according to folder and title for future storage
- removed home button from minis as not needed
- reduced animations and changed some text styling for the minis container
- fixed an issue with the cta minis button on other pages where position was fixed causing to go everywhere
- reworked the adding minis part to show a live preview

### 3.0 (22/08/2025)
- fixed lag and responsiveness of the minis page for mobile and pretty much all types of devices.
- fixed an issue in the generation of the filename and date, it was meant to capture the user time but language settings were a barrier, switched to clear function of IST timezone.
- removed some useless hover features as a part of reducing lag on minis site.

### 2.9 (21/08/25)
- minis.beyondmebtw.com is launched, it is a live blog which is a short form version of content delivery
- backend support for adding new posts was added with features like images,links,italics and bold also added.
- had to change the way the authentication worked from session storage to cookies to allow for easier aunthenitcation due the fact that the backend for the minis is shifted from manage to its own folder
- made the minis page more stylized than the rest, might do it for the others or create a new seprate version called BMB in HD3D just for fun to see how much design can be made
- added a minis cta on home,blog,projects and about page. responsiveness was done for that as well.
- fixed featured projects on homepage that was removed when manage server functions were removed for updating projects due not being used.

### 2.8 (19/08/25)
- added a feature in projects page where it scrolls to the top when view details are clicked on smaller devices
- new project was added (haptic trailer : android recreation)

### 2.7 (08/08/25)
- added a latest posts area so for reference
- setup a domain for the content server, content.beyondmebtw.com for ease
- have to fix an issue with captilization to ensure no issue during data updation
- add a function so that the latest posts part in the manage tab also gets updated when a new post is added.

### 2.6 (29/07/25)
- Revamped the blog page, now shows all posts
- removed latest posts grid
- added an intro section to the blog page
- added a category selector at the start, this has subcategories as well
- changed json formatting to accomadate duplicate posts by adding secondaryCategory and secondarySubCategory values
- search bar is still there
- added a scroll to top button at the bottom right for accessibility
- fixed responsiveness on mobile devices

Working on a mini's section(name not finalized). This will be more like a feed where i can update or talk about stuff daily without having to create mt full production article. \
Goal is to be more online and allow for quicker creative output.

### 2.5 (18/7/25)
- Built the blog page
- added the posts along with information and categoreis and sub categories
- created a content server for the images
- styled it work with responsive designs
- redirected previously other medium links to the blog part
- current posts redirect to medium but will eventually change, i am going to be building a platform to view the content, will use a framework like lit or svelte kit
- fixed styling on blog page
- fixed fonts on blog page

### V2.4 (15/7/25)
- Fixed styling across the site for uniformity
- changed skills orientation in about section

### V2.3 (4/7/25)
- Projects page data is added

### V2.2 (1/4/25)
- About Page Added
- changed some fonts on the home pages for the section titles
- made changes to responsiveness to accomodate for various screen sizes

### V 2.1 (14/3/25)
- Added a light/dark mode toggle button (still in development)
- Fixed Medium logo in the "Get in Touch" section
- Made the featured projects retrieve data from a JSON file
- Changed font of the header links

### V 2.0 (3/3/25)
- Launched Version 2 of the revamp
- Old version can be viewed at [Beyond Me Btw V1](https://beyondmebtw.com/projects/V1)
- Old Changelog can be viewed at [Changelog](projects/V1/Readme.md)
- Stopped updating Wix site due to too many bugs, blogs posted only on [Medium](https://blog.beyondmebtw.com)
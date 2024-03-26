from tkinter import *

def filler():

    hide_stuff(howtotext)
    hide_stuff(backhome)
    
    hide_stuff(score)
    
    hide_stuff(frame1)
    hide_stuff(frame2)
    hide_stuff(frame3)
    
    hide_stuff(frame4)
    hide_stuff(frame5)
    hide_stuff(frame6)
    hide_stuff(frame7)
    
    hide_stuff(level1text)
    hide_stuff(level2text)
    hide_stuff(nooftriestext)
    
    hide_stuff(prize_text)
    hide_stuff(prize_button)
    hide_stuff(playagainbutton)
      
def quitthegame():
    root.destroy()

def homepage():
    hide_stuff(howtotext)
    hide_stuff(backhome)

    show_stuff(start)
    start.pack(padx=20,pady=20)
    
    show_stuff(quitgame)
    quitgame.pack(padx=20,pady=20)
    
def startgame():
    root.geometry('600x900')
    show_stuff(level1text)
    level1text.pack(side=TOP,anchor='n')
    
    hide_stuff(start)
    
    hide_stuff(quitgame)
    
    show_stuff(howtotext)
    howtotext.pack(side=BOTTOM,anchor="s")    
    howtotext.config(font=('Times',15,'bold'),bg='orange')
    
    hide_stuff(topfiller)
    topfiller.config(bg='orange')
    
    show_stuff(score)
    
    show_stuff(frame1)
    show_stuff(frame2)
    show_stuff(frame3)
    
    show_stuff(nooftriestext)
    
    score.pack(side=TOP,anchor='n')
    frame1.pack(side=TOP,anchor='n',padx=10)
    frame2.pack(side=TOP,anchor='n',padx=10)
    frame3.pack(side=TOP,anchor='n',padx=10)
    
    root.config(bg="orange")
    
def playagain():
    hide_stuff(playagainbutton)
    
    
    solvedvar.set(0)
    storecell1.set("0")
    storecell1.set("0")
    storevar1.set(0)
    storevar2.set(0)
    scorevar.set(0)
    nooftries.set(0)
    
    
    score.config(text="Score : 0")
    startgame()      
    nooftriestext.config(text="No. of tries : 0")
    
    score.pack(side=TOP,anchor='n')
    frame1.pack(side=TOP,anchor='n')
    frame2.pack(side=TOP,anchor='n')
    frame3.pack(side=TOP,anchor='n')
            
    hide_stuff(prize_text)
    hide_stuff(prize_button)    
    
    cell1.config(text="?",bg="black",command=lambda:checker(1,cell1,"cell1"))
    cell2.config(text="?",bg="black",command=lambda:checker(2,cell2,"cell2"))
    cell3.config(text="?",bg="black",command=lambda:checker(5,cell3,"cell3"))
    cell4.config(text="?",bg="black",command=lambda:checker(4,cell4,"cell4"))
            
    cell5.config(text="?",bg="black",command=lambda:checker(2,cell5,"cell5"))
    cell6.config(text="?",bg="black",command=lambda:checker(1,cell6,"cell6"))
    cell7.config(text="?",bg="black",command=lambda:checker(3,cell7,"cell7"))
    cell8.config(text="?",bg="black",command=lambda:checker(6,cell8,"cell8"))
            
    cell9.config(text="?",bg="black",command=lambda:checker(3,cell9,"cell9"))
    cell10.config(text="?",bg="black",command=lambda:checker(6,cell10,"cell10"))
    cell11.config(text="?",bg="black",command=lambda:checker(4,cell11,"cell11"))
    cell12.config(text="?",bg="black",command=lambda:checker(5,cell12,"cell12"))
    
    l2cell1.config(text="?",bg="black",command=lambda:checker2(1,l2cell1,"l2cell1"))
    l2cell2.config(text="?",bg="black",command=lambda:checker2(9,l2cell2,"l2cell2"))
    l2cell3.config(text="?",bg="black",command=lambda:checker2(7,l2cell3,"l2cell3"))
    l2cell4.config(text="?",bg="black",command=lambda:checker2(6,l2cell4,"l2cell4"))
    l2cell5.config(text="?",bg="black",command=lambda:checker2(3,l2cell5,"l2cell5"))
    
    l2cell6.config(text="?",bg="black",command=lambda:checker2(10,l2cell6,"l2cell6"))
    l2cell7.config(text="?",bg="black",command=lambda:checker2(4,l2cell7,"l2cell7"))
    l2cell8.config(text="?",bg="black",command=lambda:checker2(8,l2cell8,"l2cell8"))
    l2cell9.config(text="?",bg="black",command=lambda:checker2(2,l2cell9,"l2cell9"))
    l2cell10.config(text="?",bg="black",command=lambda:checker2(5,l2cell10,"l2cell10"))
    
    l2cell11.config(text="?",bg="black",command=lambda:checker2(9,l2cell11,"l2cell11"))
    l2cell12.config(text="?",bg="black",command=lambda:checker2(10,l2cell12,"l2cell12"))
    l2cell13.config(text="?",bg="black",command=lambda:checker2(1,l2cell13,"l2cell13"))
    l2cell14.config(text="?",bg="black",command=lambda:checker2(4,l2cell14,"l2cell14"))
    l2cell15.config(text="?",bg="black",command=lambda:checker2(6,l2cell15,"l2cell15"))
    
    l2cell16.config(text="?",bg="black",command=lambda:checker2(3,l2cell16,"l2cell16"))
    l2cell17.config(text="?",bg="black",command=lambda:checker2(8,l2cell17,"l2cell17"))
    l2cell18.config(text="?",bg="black",command=lambda:checker2(5,l2cell18,"l2cell18"))
    l2cell19.config(text="?",bg="black",command=lambda:checker2(7,l2cell19,"l2cell19"))
    l2cell20.config(text="?",bg="black",command=lambda:checker2(2,l2cell20,"l2cell20"))
    
def hide_stuff(widget):
    widget.pack_forget()

def show_stuff(widget):
    widget.pack()
    
def checker(value,cellname,cellstr):
    solvedvar.set(6)
    cellname.config(text=value,bg='blue')

    if countvar.get() == 1:
        storevar1.set(value)
        cellname.config(command=())
        storecell1.set(cellstr)
        countvar.set(2)

    else:
        storevar2.set(value)
        storecell2.set(cellstr)
        cellname.config(command=())
        cellname.config(text=value)
        
        if storecell1.get() == storecell2.get():
            storevar2.set(0)
        
        if storevar1.get() == storevar2.get():
            
            scorevar.set(scorevar.get() + 100)
            score.config(text=f"Score: {scorevar.get()}")
            
            countvar.set(1)
            
            storevar1.set(0)
            storevar2.set(0)
            
            solvedvar.set(solvedvar.get()+1)
            nooftries.set(nooftries.get()+1)
            nooftriestext.config(text=f"No. of tries:{nooftries.get()}")
        
        elif storevar1.get() != storevar2.get():
            
            nooftries.set(nooftries.get()+1)
            nooftriestext.config(text=f"No. of tries:{nooftries.get()}")
            countvar.set(1)
            
            storevar1.set(0)
            storevar2.set(0)
            
            def delaycellname():            
                cellname.config(text="?",bg="black")
            
                if storecell1.get() == "cell1":
                    cell1.config(text="?",bg="black")
                    cell1.config(command=lambda:checker(1,cell1,"cell1"))
            
                elif storecell1.get() == "cell2":
                   cell2.config(text="?",bg="black")
                   cell2.config(command=lambda:checker(2,cell2,"cell2"))
                
                elif storecell1.get() == "cell3":
                    cell3.config(text="?",bg="black")
                    cell3.config(command=lambda:checker(5,cell3,"cell3"))
                
                elif storecell1.get() == "cell4":
                    cell4.config(text="?",bg="black")
                    cell4.config(command=lambda:checker(4,cell4,"cell4"))
                
                elif storecell1.get() == "cell5":
                    cell5.config(text="?",bg="black")
                    cell5.config(command=lambda:checker(2,cell5,"cell5"))
                
                elif storecell1.get() == "cell6":
                    cell6.config(text="?",bg="black")
                    cell6.config(command=lambda:checker(1,cell6,"cell6"))
            
                elif storecell1.get() == "cell7":
                    cell7.config(text="?",bg="black")
                    cell7.config(command=lambda:checker(3,cell7,"cell7"))
                
                elif storecell1.get() == "cell8":
                    cell8.config(text="?",bg="black")
                    cell8.config(command=lambda:checker(6,cell8,"cell8"))
                
                elif storecell1.get() == "cell9":
                    cell9.config(text="?",bg="black")
                    cell9.config(command=lambda:checker(3,cell9,"cell9"))
                
                elif storecell1.get() == "cell10":
                    cell10.config(text="?",bg="black")
                    cell10.config(command=lambda:checker(6,cell10,"cell10"))
                
                elif storecell1.get() == "cell11":
                    cell11.config(text="?",bg="black")
                    cell11.config(command=lambda:checker(4,cell11,"cell11"))
                
                elif storecell1.get() == "cell12":
                    cell12.config(text="?",bg="black")
                    cell12.config(command=lambda:checker(5,cell12,"cell12"))
                
                    ##############################################
                if storecell2.get() == "cell1":
                    cell1.config(text="?",bg="black")
                    cell1.config(command=lambda:checker(1,cell1,"cell1"))
            
                elif storecell2.get() == "cell2":
                    cell2.config(text="?",bg="black")
                    cell2.config(command=lambda:checker(2,cell2,"cell2"))
                
                elif storecell2.get() == "cell3":
                    cell3.config(text="?",bg="black")
                    cell3.config(command=lambda:checker(5,cell3,"cell3"))
                
                elif storecell2.get() == "cell4":
                    cell4.config(text="?",bg="black")
                    cell4.config(command=lambda:checker(4,cell4,"cell4"))
                
                elif storecell2.get() == "cell5":
                    cell5.config(text="?",bg="black")
                    cell5.config(command=lambda:checker(2,cell5,"cell5"))
                
                elif storecell2.get() == "cell6":
                    cell6.config(text="?",bg="black")
                    cell6.config(command=lambda:checker(1,cell6,"cell6"))
            
                elif storecell2.get() == "cell7":
                    cell7.config(text="?",bg="black")
                    cell7.config(command=lambda:checker(3,cell7,"cell7"))
                
                elif storecell2.get() == "cell8":
                    cell8.config(text="?",bg="black")
                    cell8.config(command=lambda:checker(6,cell8,"cell8"))
                
                elif storecell2.get() == "cell9":
                    cell9.config(text="?",bg="black")
                    cell9.config(command=lambda:checker(3,cell9,"cell9"))
                
                elif storecell2.get() == "cell10":
                    cell10.config(text="?",bg="black")
                    cell10.config(command=lambda:checker(6,cell10,"cell10"))
                
                elif storecell2.get() == "cell11":
                    cell11.config(text="?",bg="black")
                    cell11.config(command=lambda:checker(4,cell11,"cell11"))
                
                elif storecell2.get() == "cell12":
                    cell12.config(text="?",bg="black")
                    cell12.config(command=lambda:checker(5,cell12,"cell12"))
                      
            root.after(300,delaycellname)
                        
    if(solvedvar.get()==6):
        def delay():
            # hide_stuff(score)
    
            hide_stuff(frame1)
            hide_stuff(frame2) 
            hide_stuff(frame3)
            
            hide_stuff(level1text)
    
            hide_stuff(score)
            hide_stuff(level2text)
            
            # show_stuff(prize_text)
            # show_stuff(prize_button)
            # show_stuff(playagainbutton)
            # playagainbutton.pack(pady=20)
            # hide_stuff(howtotext)
            
            countvar.set(1)
            
            storevar1.set(0)
            storevar2.set(0)
            
            storecell1.set("0")
            storecell2.set("0")
            solvedvar.set("0")
            
            displaylevel2()
            
                                
        root.after(1000,delay)

def displaylevel2():
    hide_stuff(howtotext)
    
    show_stuff(level2text)
    
    show_stuff(howtotext)
    howtotext.pack(side=BOTTOM,anchor="s")
    howtotext.config(font=('Times',15,'bold'),bg='orange')
    
    show_stuff(score)
    
    level2text.pack(side=TOP,anchor='n')
    
    hide_stuff(nooftriestext)
    
    show_stuff(frame4)
    show_stuff(frame5)
    show_stuff(frame6)
    show_stuff(frame7)
    
    show_stuff(nooftriestext)
    
    solvedvar.set(0)

def checker2(value,cellname,cellstr):
    cellname.config(text=value,bg='blue')
    solvedvar.set(10)
    if countvar.get() == 1:
        storevar1.set(value)
        cellname.config(command=())
        storecell1.set(cellstr)
        countvar.set(2)

    else:
        storevar2.set(value)
        storecell2.set(cellstr)
        cellname.config(command=())
        cellname.config(text=value)
        
        if storecell1.get() == storecell2.get():
            storevar2.set(0)
        
        
        if storevar1.get() == storevar2.get():
            
            scorevar.set(scorevar.get() + 100)
            score.config(text=f"Score: {scorevar.get()}")
            
            countvar.set(1)
            
            storevar1.set(0)
            storevar2.set(0)
            
            solvedvar.set(solvedvar.get()+1)
            
            nooftries.set(nooftries.get()+1)
            nooftriestext.config(text=f"No. of tries:{nooftries.get()}")
        
        elif storevar1.get() != storevar2.get():
            
            nooftries.set(nooftries.get()+1)
            nooftriestext.config(text=f"No. of tries:{nooftries.get()}")
            
            countvar.set(1)
            
            storevar1.set(0)
            storevar2.set(0)
            
            def delaycellname2():
                cellname.config(text="?",bg="black")

                if storecell1.get() == "l2cell1":
                  l2cell1.config(text="?",bg="black",command=lambda:checker2(1,l2cell1,"l2cell1"))
                elif storecell1.get() == "l2cell2":
                    l2cell2.config(text="?",bg="black",command=lambda:checker2(9,l2cell2,"l2cell2"))
                elif storecell1.get() == "l2cell3":
                    l2cell3.config(text="?",bg="black",command=lambda:checker2(7,l2cell3,"l2cell3"))
                elif storecell1.get() == "l2cell4":
                    l2cell4.config(text="?",bg="black",command=lambda:checker2(6,l2cell4,"l2cell4"))
                elif storecell1.get() == "l2cell5":
                    l2cell5.config(text="?",bg="black",command=lambda:checker2(3,l2cell5,"l2cell5"))
                elif storecell1.get() == "l2cell6":
                    l2cell6.config(text="?",bg="black",command=lambda:checker2(10,l2cell6,"l2cell6"))
                elif storecell1.get() == "l2cell7":
                    l2cell7.config(text="?",bg="black",command=lambda:checker2(4,l2cell7,"l2cell7"))
                elif storecell1.get() == "l2cell8":
                    l2cell8.config(text="?",bg="black",command=lambda:checker2(8,l2cell8,"l2cell8"))
                elif storecell1.get() == "l2cell9":
                    l2cell9.config(text="?",bg="black",command=lambda:checker2(2,l2cell9,"l2cell9"))
                elif storecell1.get() == "l2cell10":
                    l2cell10.config(text="?",bg="black",command=lambda:checker2(5,l2cell10,"l2cell10"))
                elif storecell1.get() == "l2cell11":
                    l2cell11.config(text="?",bg="black",command=lambda:checker2(9,l2cell11,"l2cell11"))
                elif storecell1.get() == "l2cell12":
                    l2cell12.config(text="?",bg="black",command=lambda:checker2(10,l2cell12,"l2cell12"))
                elif storecell1.get() == "l2cell13":
                    l2cell13.config(text="?",bg="black",command=lambda:checker2(1,l2cell13,"l2cell13"))
                elif storecell1.get() == "l2cell14":
                    l2cell14.config(text="?",bg="black",command=lambda:checker2(4,l2cell14,"l2cell14"))
                elif storecell1.get() == "l2cell15":
                    l2cell15.config(text="?",bg="black",command=lambda:checker2(6,l2cell15,"l2cell15"))
                elif storecell1.get() == "l2cell16":
                    l2cell16.config(text="?",bg="black",command=lambda:checker2(3,l2cell16,"l2cell16"))
                elif storecell1.get() == "l2cell17":
                    l2cell17.config(text="?",bg="black",command=lambda:checker2(8,l2cell17,"l2cell17"))
                elif storecell1.get() == "l2cell18":
                    l2cell18.config(text="?",bg="black",command=lambda:checker2(5,l2cell18,"l2cell18"))
                elif storecell1.get() == "l2cell19":
                    l2cell19.config(text="?",bg="black",command=lambda:checker2(7,l2cell19,"l2cell19"))
                elif storecell1.get() == "l2cell20":
                    l2cell20.config(text="?",bg="black",command=lambda:checker2(2,l2cell20,"l2cell20"))

                #################################
                
                if storecell2.get() == "l2cell1":
                    l2cell1.config(text="?",bg="black",command=lambda:checker2(1,l2cell1,"l2cell1"))
                elif storecell2.get() == "l2cell2":
                    l2cell2.config(text="?",bg="black",command=lambda:checker2(9,l2cell2,"l2cell2"))
                elif storecell2.get() == "l2cell3":
                    l2cell3.config(text="?",bg="black",command=lambda:checker2(7,l2cell3,"l2cell3"))
                elif storecell2.get() == "l2cell4":
                    l2cell4.config(text="?",bg="black",command=lambda:checker2(6,l2cell4,"l2cell4"))
                elif storecell2.get() == "l2cell5":
                    l2cell5.config(text="?",bg="black",command=lambda:checker2(3,l2cell5,"l2cell5"))
                elif storecell2.get() == "l2cell6":
                    l2cell6.config(text="?",bg="black",command=lambda:checker2(10,l2cell6,"l2cell6"))
                elif storecell2.get() == "l2cell7":
                    l2cell7.config(text="?",bg="black",command=lambda:checker2(4,l2cell7,"l2cell7"))
                elif storecell2.get() == "l2cell8":
                    l2cell8.config(text="?",bg="black",command=lambda:checker2(8,l2cell8,"l2cell8"))
                elif storecell2.get() == "l2cell9":
                    l2cell9.config(text="?",bg="black",command=lambda:checker2(2,l2cell9,"l2cell9"))
                elif storecell2.get() == "l2cell10":
                    l2cell10.config(text="?",bg="black",command=lambda:checker2(5,l2cell10,"l2cell10"))
                elif storecell2.get() == "l2cell11":
                    l2cell11.config(text="?",bg="black",command=lambda:checker2(9,l2cell11,"l2cell11"))
                elif storecell2.get() == "l2cell12":
                    l2cell12.config(text="?",bg="black",command=lambda:checker2(10,l2cell12,"l2cell12"))
                elif storecell2.get() == "l2cell13":
                    l2cell13.config(text="?",bg="black",command=lambda:checker2(1,l2cell13,"l2cell13"))
                elif storecell2.get() == "l2cell14":
                    l2cell14.config(text="?",bg="black",command=lambda:checker2(4,l2cell14,"l2cell14"))
                elif storecell2.get() == "l2cell15":
                    l2cell15.config(text="?",bg="black",command=lambda:checker2(6,l2cell15,"l2cell15"))
                elif storecell2.get() == "l2cell16":
                    l2cell16.config(text="?",bg="black",command=lambda:checker2(3,l2cell16,"l2cell16"))
                elif storecell2.get() == "l2cell17":
                    l2cell17.config(text="?",bg="black",command=lambda:checker2(8,l2cell17,"l2cell17"))
                elif storecell2.get() == "l2cell18":
                    l2cell18.config(text="?",bg="black",command=lambda:checker2(5,l2cell18,"l2cell18"))
                elif storecell2.get() == "l2cell19":
                    l2cell19.config(text="?",bg="black",command=lambda:checker2(7,l2cell19,"l2cell19"))
                elif storecell2.get() == "l2cell20":
                    l2cell20.config(text="?",bg="black",command=lambda:checker2(2,l2cell20,"l2cell20"))

            root.after(300,delaycellname2)


        
    if(solvedvar.get()==10):
        # score.config(text="\n\nCompleted")
                       
        def delay():
            hide_stuff(score)
    
            hide_stuff(frame1)
            hide_stuff(frame2)
            hide_stuff(frame3)
            
            hide_stuff(frame4)
            hide_stuff(frame5)
            hide_stuff(frame6)
            hide_stuff(frame7)
            
            show_stuff(prize_text)
            show_stuff(prize_button)
            show_stuff(playagainbutton)
            playagainbutton.pack(pady=20)
            hide_stuff(howtotext)
            hide_stuff(nooftriestext)
            hide_stuff(level2text)
                                
        root.after(1000,delay)   
        
def prize():    
    prize_button.config(text="NOTHING",bg="blue",fg='white')
    
    

##########################################################################



root  = Tk(className="Pair Game")
root.geometry('500x500')
root.configure(bg='violet')
root.title("Match The Pair By Pranav Veeraghanta")

# image = PhotoImage(file="bgtest.jpg")
# canvas1 = Canvas(root,width=700,height=700)
# canvas1.pack(fill="both",expand=True)
# canvas1.create_image( 0, 0, image = image,  
#                      anchor = "nw") 

# global variables

nooftries = IntVar()
nooftries.set(0)

scorevar = IntVar()
scorevar.set(0)

storevar1 = IntVar()
storevar1.set(0)

storevar2 = IntVar()
storevar2.set(0)

storecell1 = StringVar()
storecell1.set("a")

storecell2 = StringVar()
storecell2.set("a")

countvar = IntVar()
countvar.set(1)

solvedvar = IntVar()
solvedvar.set(0)

# home section

level1text = Label(root,text="LEVEL 1",bg='orange',fg='Black',font=("MS Gothic",45,'bold'))
level1text.pack(side=TOP,anchor='n')

level2text = Label(root,text="LEVEL 2",bg='orange',fg='Black',font=("MS Gothic",45,'bold'))
level2text.pack(side=TOP,anchor='n')

topfiller = Label(root,text="\n\n\n\n\n\n\n\n\n\n\n\n",
                  bg='violet')
topfiller.pack()

start = Button(root,text="Start Game",
               font=("Times",25),
               bg="black",
               padx=42,
               fg='white',
               command=lambda:startgame())
start.pack(padx=24)

quitgame = Button(root,text="Exit",
                  command=lambda:quitthegame(),
                  font=("Times",25),
                   bg="black",
                   padx=90,
                   fg='white')
quitgame.pack(padx=20,pady=20)

# how to play section

howtotext = Label(root,text="\t        HOW TO PLAY\n\n  1. Click on any 2 squares to reveal a number.\n\n  2. If the numbers match you get 100 points.\n\n  3. If the numbers don't match the squares\n\n      will be hidden and you can try again.\n\n  4. You have infinite number of tries!!!\n\n",
                  font=('Times',20,'bold'),
                  bg='violet',
                  fg='black',
                  justify=LEFT)
howtotext.pack(side=TOP)



backhome = Button(root,text="Back",
                  font=("Times",25),
               bg="black",
               fg='white',
               padx=90,
               command=lambda:homepage())

# game section:

score = Label(root,text=f"Score: {scorevar.get()}",
              font=('MS Gothic',37,'bold'),
              bg='orange',
              fg='white',)
score.pack()

# level 1

frame1 = Frame(root,bg='orange')
frame1.pack(side=TOP, padx=5, pady=5,)

frame2 = Frame(root,bg='orange')
frame2.pack(side=TOP, padx=5, pady=5)

frame3 = Frame(root,bg='orange')
frame3.pack(side=TOP, padx=5, pady=5)

cell1 = Button(frame1,text="?",
              font=("Times",40),
               bg="black",
               fg='white',
               padx=5,
               command=lambda:checker(1,cell1,"cell1"))
cell1.pack(side=LEFT,
           padx=10,
           pady=10)

cell2 = Button(frame1,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(2,cell2,"cell2"))
cell2.pack(side=LEFT,
           padx=10,
           pady=10)

cell3 = Button(frame1,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(5,cell3,"cell3"))
cell3.pack(side=LEFT,
           padx=10,
           pady=10)

cell4 = Button(frame1,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(4,cell4,"cell4"))
cell4.pack(side=LEFT,
           padx=10,
           pady=10)

#############################################################

cell5 = Button(frame2,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(2,cell5,"cell5"))
cell5.pack(side=LEFT,
           padx=10,
           pady=10)

cell6 = Button(frame2,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(1,cell6,"cell6"))
cell6.pack(side=LEFT,
           padx=10,
           pady=10)

cell7 = Button(frame2,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(3,cell7,"cell7"))
cell7.pack(side=LEFT,
           padx=10,
           pady=10)

cell8 = Button(frame2,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(6,cell8,"cell8"))
cell8.pack(side=LEFT,
           padx=10,
           pady=10)

########################################################

cell9 = Button(frame3,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(3,cell9,"cell9"))
cell9.pack(side=LEFT,
           padx=10,
           pady=10)

cell10 = Button(frame3,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(6,cell10,"cell10"))
cell10.pack(side=LEFT,
           padx=10,
           pady=10)

cell11 = Button(frame3,text="?",
              font=("Times",40),
               bg="black",
               fg='white',padx=5,
               command=lambda:checker(4,cell11,"cell11"))
cell11.pack(side=LEFT,
           padx=10,
           pady=10)

cell12 = Button(frame3,text="?",font=("Times",40),bg="black",padx=5,fg='white',command=lambda:checker(5,cell12,"cell12"))
cell12.pack(side=LEFT,padx=10,pady=10)

## level 2

frame4 = Frame(root,bg='orange')
frame4.pack(side=TOP, padx=5, pady=5,)

frame5 = Frame(root,bg='orange')
frame5.pack(side=TOP, padx=5, pady=5)

frame6 = Frame(root,bg='orange')
frame6.pack(side=TOP, padx=5, pady=5)

frame7 = Frame(root,bg='orange')
frame7.pack(side=TOP, padx=5, pady=5)

l2cell1 = Button(frame4,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(1,l2cell1,"l2cell1"))
l2cell1.pack(side=LEFT,padx=10,pady=10)
l2cell2 = Button(frame4,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(9,l2cell2,"l2cell2"))
l2cell2.pack(side=LEFT,padx=10,pady=10)
l2cell3 = Button(frame4,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(7,l2cell3,"l2cell3"))
l2cell3.pack(side=LEFT,padx=10,pady=10)
l2cell4 = Button(frame4,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(6,l2cell4,"l2cell4"))
l2cell4.pack(side=LEFT,padx=10,pady=10)
l2cell5 = Button(frame4,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(3,l2cell5,"l2cell5"))
l2cell5.pack(side=LEFT,padx=10,pady=10)

l2cell6 = Button(frame5,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(10,l2cell6,"l2cell6"))
l2cell6.pack(side=LEFT,padx=10,pady=10)
l2cell7 = Button(frame5,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(4,l2cell7,"l2cell7"))
l2cell7.pack(side=LEFT,padx=10,pady=10)
l2cell8 = Button(frame5,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(8,l2cell8,"l2cell8"))
l2cell8.pack(side=LEFT,padx=10,pady=10)
l2cell9 = Button(frame5,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(2,l2cell9,"l2cell9"))
l2cell9.pack(side=LEFT,padx=10,pady=10)
l2cell10 = Button(frame5,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(5,l2cell10,"l2cell10"))
l2cell10.pack(side=LEFT,padx=10,pady=10)

l2cell11 = Button(frame6,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(9,l2cell11,"l2cell11"))
l2cell11.pack(side=LEFT,padx=10,pady=10)
l2cell12 = Button(frame6,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(10,l2cell12,"l2cell12"))
l2cell12.pack(side=LEFT,padx=10,pady=10)
l2cell13 = Button(frame6,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(1,l2cell13,"l2cell13"))
l2cell13.pack(side=LEFT,padx=10,pady=10)
l2cell14 = Button(frame6,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(4,l2cell14,"l2cell14"))
l2cell14.pack(side=LEFT,padx=10,pady=10)
l2cell15 = Button(frame6,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(6,l2cell15,"l2cell15"))
l2cell15.pack(side=LEFT,padx=10,pady=10)

l2cell16 = Button(frame7,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(3,l2cell16,"l2cell16"))
l2cell16.pack(side=LEFT,padx=10,pady=10)
l2cell17 = Button(frame7,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(8,l2cell17,"l2cell17"))
l2cell17.pack(side=LEFT,padx=10,pady=10)
l2cell18 = Button(frame7,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(5,l2cell18,"l2cell18"))
l2cell18.pack(side=LEFT,padx=10,pady=10)
l2cell19 = Button(frame7,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(7,l2cell19,"l2cell19"))
l2cell19.pack(side=LEFT,padx=10,pady=10)
l2cell20 = Button(frame7,text="?",font=("Times",32),bg="black",padx=5,fg="white",command=lambda:checker2(2,l2cell20,"l2cell20"))
l2cell20.pack(side=LEFT,padx=10,pady=10)

##

nooftriestext = Label(root,text="No. of tries : 0",font=('MS Gothic',32,'bold'),
              bg='orange',
              fg='white')
nooftriestext.pack()

## prize screen

prize_text = Label(root,text="\n\n\n\n\n\n  Congratulations!!!\n\n      You've Won:\n",font=('Times',25,'bold'),bg='orange',fg='white',padx=95,justify=LEFT)
prize_text.pack()

prize_button = Button(root,text="PRIZE",font=("Times",25),
               bg="violet",
               fg='black',
               command=lambda:prize())
prize_button.pack()

playagainbutton = Button(root,text="Play Again",font=("Times",25),
               bg="black",
               fg='white',
               command=lambda:playagain())
playagainbutton.pack(pady=20)

filler()


root.mainloop()

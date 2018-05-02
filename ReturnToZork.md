Return to Zork
---------------

Final Project for DH-150 
Winter 2018 

Text adventure games used to be cutting edge! When you only had a keyboard to use a computer, you could type commands to navigate through a world, solve problems, and vanquish foes. It wasn’t exactly a Nintendo Switch, but it was a gateway to other worlds. And text adventures are still a great way to show off your programming skills! One of the most classic early video games is Zork. To get an idea of what a text adventure game looks like, go to https://classicreload.com/zork-i.html. Your mini-dungeon should have a similar text interface, and include five rooms, oriented as illustrated below. 

	  _________________
	 |        |        |
	 |  start |   key  |
	 |________|________|
	 |        |        |
	 |        | monster|
	 |_locked_|________|
	 |        |
	 |treasure|
	 |________|
	 

Your text adventure should include the following commands: 

* “look” returns what is in the room. You can have fun with the descriptions ☺ but they should at minimum show the items/monster and exits below in the appropriate room. 
* North, south, east, west navigates through the rooms. If you try to go beyond the room, your program should print “Stop banging your head against a wall!” 
* “pick up itemname” should store that item in your inventory. 
* “attack monstername” should attack a monster with your bare hands, or a sword if you have one. 
* “open door” opens the door if you have a key, and “open chest” opens the chest.  
* “inventory” should print out the items in your inventory. E.g. “You have a sword and a key.” 

Gameplay: 

* The door should be initially locked, and tells the user “Hmm, if only you had a key!” if you try to open it. Once you pick up the key, you can open it. 
* The Grue monster should kill you if try to attack it without having the sword. 
* Once you open the door using the key, the chest holds a sword that you can use to attack and kill the Grue. 
* The game should remember items and events. For example, when you pick up the key, it no longer appears in the room, and “locked door” should turn into “open door” once opened. 

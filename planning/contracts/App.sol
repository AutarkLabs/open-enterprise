pragma solidity ^0.4.4;

import "@aragon/os/contracts/apps/AragonApp.sol";


contract App is AragonApp {
	////
	////	           ....
	////	       .,,,,..,,,,.
	////	   ..,,.. ..     .,,,..
	////	 .,,.  ..,:....,,..  .,,.
	////	,:   ...,.    .,,..,.   :,
	////	.:. ,. ,           ,.. .:.
	////	 ,:,.  ..        .,,., :,
	////	  ,;.   ........,..,..:,
	////	   ,:.       .. .....:,
	////	    .:,           .::.
	////	      .,,.      .,,.
	////	        .,,,..,,,.
	////	           ....
	////
	////  Build something beautiful.
	function initialize(string _name) onlyInit
	{
		initialized();
	}
}

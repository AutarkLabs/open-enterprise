pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "@aragon/os/contracts/lib/zeppelin/math/SafeMath.sol";

//import "@aragon/os/contracts/common/IForwarder.sol";


contract RangeVoting is AragonApp {
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

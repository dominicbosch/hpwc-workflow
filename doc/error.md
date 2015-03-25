Error Handling
==============

Errors returned through callbacks in this system are NOT standard JS Errors ( new Error(...) ), but a JSON object consisting of following properties:

- code: The error code. One of:
	- 0: Standard error, no distinct meaning
	- 1: Error occured during a client request. The answer to the client was already sent and therefore any subsequent callback function MUST NOT reply to the user AGAIN!
	- 2: Error occured during an SSH command and was printed on the STDERR by the remote machine.
- message: A string which describes the error.


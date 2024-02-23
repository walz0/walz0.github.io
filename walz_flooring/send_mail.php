<?php
$webmaster_email = "j.m.walz@sbcglobal.net";

$feedback_page = "index.html";
$error_page = "error_message.html";
$thankyou_page = "thank_you.html";

$email_address = $_REQUEST['email_address'];
$phone_number = $_REQUEST['phone_number'];
$comments = $_REQUEST['comments'];
$first_name = $_REQUEST['first_name'];
$last_name = $_REQUEST['last_name'];
$msg = "You have received a contact request from " . $first_name . " " . $last_name . ".\r\n" .
"Email: " . $email_address . "\r\n" . 
"Phone: " . $phone_number . "\r\n" . 
"Comments: " . $comments ;

function isInjected($str) {
	$injections = array('(\n+)',
	'(\r+)',
	'(\t+)',
	'(%0A+)',
	'(%0D+)',
	'(%08+)',
	'(%09+)'
	);
	$inject = join('|', $injections);
	$inject = "/$inject/i";
	if(preg_match($inject,$str)) {
		return true;
	}
	else {
		return false;
	}
}

if (!isset($_REQUEST['email_address'])) {
    header( "Location: $feedback_page" );
}
elseif (empty($first_name) || empty($last_name) || empty($email_address) || empty($phone_number)) {
    // header( "Location: $error_page" );
}
elseif ( isInjected($email_address) || isInjected($first_name)  || isInjected($comments) ) {
    // header( "Location: $error_page" );
}
else {
	mail( "$webmaster_email", "New Client Notication", $msg );

	header( "Location: $thankyou_page" );
}
?>

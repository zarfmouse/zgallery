#!/usr/bin/perl 

use strict;
use warnings;
use utf8;

use FindBin qw($RealBin);

use IO::Handle;
STDOUT->autoflush(1);
STDERR->autoflush(1);
STDOUT->binmode(":utf8");
STDERR->binmode(":utf8");

use CGI;
use Data::Dumper qw(Dumper);
use JSON qw(decode_json encode_json);
use Storable qw(lock_store lock_retrieve);
use IO::File;

my $data_file = "$RealBin/../images/slides.storable";
my $password = 'changeme';

my $cgi = CGI->new();
eval {
    if($cgi->param("POSTDATA")) {
	my $json = $cgi->param("POSTDATA");
	my $data = decode_json($json);
	if($data->{password} eq $password) {
	    delete $data->{password};
	    lock_store($data => $data_file);
	    print $cgi->header("appliation/json");
	    print $json;
	} else {
	    die "Invalid password.";
	}
    } else {
	my $data = lock_retrieve($data_file);
	my $json = encode_json($data);
	print $cgi->header("appliation/json");
	print $json;
    }
};

if($@) {
    print $cgi->header(-status => '500 Server Error', 
		       -type => "text/plain");
    print $@;
}

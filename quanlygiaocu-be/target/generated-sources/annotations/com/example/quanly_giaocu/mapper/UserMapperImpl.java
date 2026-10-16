package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.request.UserCreationRequest;
import com.example.quanly_giaocu.dto.request.UserUpdateRequest;
import com.example.quanly_giaocu.dto.response.UserResponse;
import com.example.quanly_giaocu.entity.Group;
import com.example.quanly_giaocu.entity.User;
import com.example.quanly_giaocu.enums.Role;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-17T00:52:40+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toUser(UserCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.username( request.getUsername() );
        user.password( request.getPassword() );
        user.fullName( request.getFullName() );
        user.email( request.getEmail() );
        if ( request.getRole() != null ) {
            user.role( Enum.valueOf( Role.class, request.getRole() ) );
        }

        return user.build();
    }

    @Override
    public UserResponse toUserResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse.UserResponseBuilder userResponse = UserResponse.builder();

        userResponse.groupName( userGroupName( user ) );
        userResponse.id( user.getId() );
        userResponse.username( user.getUsername() );
        userResponse.fullName( user.getFullName() );
        userResponse.email( user.getEmail() );
        if ( user.getRole() != null ) {
            userResponse.role( user.getRole().name() );
        }
        userResponse.position( user.getPosition() );

        return userResponse.build();
    }

    @Override
    public void updateUser(User user, UserUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        user.setFullName( request.getFullName() );
        user.setPosition( request.getPosition() );
        user.setEmail( request.getEmail() );
    }

    private String userGroupName(User user) {
        if ( user == null ) {
            return null;
        }
        Group group = user.getGroup();
        if ( group == null ) {
            return null;
        }
        String name = group.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}

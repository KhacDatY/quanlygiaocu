package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.request.GroupCreationRequest;
import com.example.quanly_giaocu.dto.request.GroupUpdateRequest;
import com.example.quanly_giaocu.dto.response.GroupResponse;
import com.example.quanly_giaocu.entity.Group;
import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-16T23:53:49+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class GroupMapperImpl implements GroupMapper {

    @Override
    public Group toGroup(GroupCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        Group.GroupBuilder group = Group.builder();

        group.name( request.getName() );

        return group.build();
    }

    @Override
    public GroupResponse toGroupResponse(Group group) {
        if ( group == null ) {
            return null;
        }

        GroupResponse.GroupResponseBuilder groupResponse = GroupResponse.builder();

        groupResponse.id( group.getId() );
        groupResponse.name( group.getName() );
        groupResponse.fundBalance( BigDecimal.valueOf( group.getFundBalance() ) );

        return groupResponse.build();
    }

    @Override
    public void updateGroup(Group group, GroupUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        group.setName( request.getName() );
    }
}
